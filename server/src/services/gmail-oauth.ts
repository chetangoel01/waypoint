import crypto from 'crypto';
import { google } from 'googleapis';
import { SupabaseClient } from '@supabase/supabase-js';
import config from '../config/index.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory store for OAuth state tokens (could use Redis in production)
const oauthStateStore = new Map<string, { userId: string; expiresAt: number }>();

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateStore.entries()) {
    if (data.expiresAt < now) {
      oauthStateStore.delete(state);
    }
  }
}, 60 * 1000); // Clean up every minute

const REDIRECT_URI = `${config.serverUrl}/api/email/callback`;
const PROVIDER = 'google_gmail';

// Get Gmail OAuth credentials from environment or throw
function getGmailCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables.');
  }
  
  return { clientId, clientSecret };
}

// Create OAuth2 client
function getOAuth2Client() {
  const credentials = getGmailCredentials();
  return new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    REDIRECT_URI
  );
}

// Generate a cryptographically random state token and store the user mapping
function generateStateToken(userId: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStateStore.set(state, {
    userId,
    expiresAt: Date.now() + STATE_EXPIRY_MS,
  });
  return state;
}

// Validate state token and return the associated user ID
export function validateStateToken(state: string): string | null {
  const data = oauthStateStore.get(state);
  if (!data) {
    return null;
  }

  // Check if expired
  if (data.expiresAt < Date.now()) {
    oauthStateStore.delete(state);
    return null;
  }

  // Delete after use (one-time use)
  oauthStateStore.delete(state);
  return data.userId;
}

// Generate the OAuth URL for user authorization
export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  const state = generateStateToken(userId);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state, // Cryptographically random state token
  });
}

// Exchange authorization code for tokens
export async function exchangeCode(
  supabase: SupabaseClient,
  userId: string,
  code: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from Google');
  }

  // Encrypt tokens before storing
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  // Save encrypted tokens to oauth_tokens table
  const { error } = await supabase.from('oauth_tokens').upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scopes: SCOPES,
      metadata: {},
    },
    { onConflict: 'user_id,provider' }
  );

  if (error) {
    throw new Error('Failed to save Gmail connection');
  }

  // Get and save user email in metadata
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  if (profile.data.emailAddress) {
    await supabase
      .from('oauth_tokens')
      .update({
        metadata: { email: profile.data.emailAddress },
      })
      .eq('user_id', userId)
      .eq('provider', PROVIDER);
  }
}

// Get stored tokens for a user (decrypts them)
async function getStoredTokens(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
  email?: string;
} | null> {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', PROVIDER)
    .single();

  if (error || !data) {
    return null;
  }

  // Decrypt tokens (handles legacy unencrypted tokens gracefully)
  const accessToken = decrypt(data.access_token);
  const refreshToken = decrypt(data.refresh_token);

  return {
    accessToken,
    refreshToken,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    email: data.metadata?.email,
  };
}

// Refresh access token if expired
async function refreshAccessToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const tokens = await getStoredTokens(supabase, userId);
  if (!tokens) {
    throw new Error('Gmail not connected');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh Gmail access');
  }

  // Encrypt and update stored access token
  const encryptedAccessToken = encrypt(credentials.access_token);
  await supabase
    .from('oauth_tokens')
    .update({
      access_token: encryptedAccessToken,
      expires_at: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
    })
    .eq('user_id', userId)
    .eq('provider', PROVIDER);

  return credentials.access_token;
}

// Get valid access token (refreshes if expired)
export async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const tokens = await getStoredTokens(supabase, userId);
  if (!tokens) {
    throw new Error('Gmail not connected');
  }

  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes

  if (tokens.expiresAt && tokens.expiresAt.getTime() < now + expiryBuffer) {
    return refreshAccessToken(supabase, userId);
  }

  return tokens.accessToken;
}

// Check if Gmail is connected for a user
export async function isConnected(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const tokens = await getStoredTokens(supabase, userId);
  return tokens !== null;
}

// Check if Gmail credentials are configured (env vars)
export function hasCredentials(): boolean {
  try {
    getGmailCredentials();
    return true;
  } catch {
    return false;
  }
}

// Get Gmail user email
export async function getGmailUserEmail(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const tokens = await getStoredTokens(supabase, userId);
  return tokens?.email || null;
}

// Disconnect Gmail for a user
export async function disconnect(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', PROVIDER);

  if (error) {
    throw new Error('Failed to disconnect Gmail');
  }
}

// Get authenticated Gmail client for a user
export async function getGmailClient(
  supabase: SupabaseClient,
  userId: string
) {
  const accessToken = await getValidAccessToken(supabase, userId);
  const credentials = getGmailCredentials();

  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}
