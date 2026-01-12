import { google } from 'googleapis';
import { SupabaseClient } from '@supabase/supabase-js';
import config from '../config/index.js';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
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

// Generate the OAuth URL for user authorization
export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state: userId, // Pass user ID in state to associate tokens with user
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

  // Save tokens to oauth_tokens table
  const { error } = await supabase.from('oauth_tokens').upsert(
    {
      user_id: userId,
      provider: PROVIDER,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      scopes: SCOPES,
      metadata: {},
    },
    { onConflict: 'user_id,provider' }
  );

  if (error) {
    throw new Error(`Failed to save Gmail tokens: ${error.message}`);
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

// Get stored tokens for a user
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

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
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
    throw new Error('No Gmail tokens stored');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  // Update stored tokens
  await supabase
    .from('oauth_tokens')
    .update({
      access_token: credentials.access_token,
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
    throw new Error(`Failed to disconnect Gmail: ${error.message}`);
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
