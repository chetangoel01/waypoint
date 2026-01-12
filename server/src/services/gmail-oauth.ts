import { google } from 'googleapis';
import { Settings } from './settings.js';
import config from '../config/index.js';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const REDIRECT_URI = `${config.serverUrl}/api/email/callback`;

// Create OAuth2 client with stored credentials
async function getOAuth2Client() {
  const credentials = await Settings.getGmailCredentials();
  if (!credentials) {
    throw new Error('Gmail credentials not configured');
  }

  return new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    REDIRECT_URI
  );
}

// Generate the OAuth URL for user authorization
export async function getAuthUrl(): Promise<string> {
  const oauth2Client = await getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeCode(code: string): Promise<void> {
  const oauth2Client = await getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from Google');
  }

  // Save tokens
  await Settings.setGmailTokens(
    tokens.access_token,
    tokens.refresh_token,
    tokens.expiry_date || Date.now() + 3600 * 1000
  );

  // Get and save user email
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  if (profile.data.emailAddress) {
    await Settings.setGmailUserEmail(profile.data.emailAddress);
  }
}

// Refresh access token if expired
export async function refreshAccessToken(): Promise<string> {
  const tokens = await Settings.getGmailTokens();
  if (!tokens) {
    throw new Error('No Gmail tokens stored');
  }

  const oauth2Client = await getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  // Update stored tokens
  await Settings.setGmailTokens(
    credentials.access_token,
    tokens.refreshToken, // Keep the same refresh token
    credentials.expiry_date || Date.now() + 3600 * 1000
  );

  return credentials.access_token;
}

// Get valid access token (refreshes if expired)
export async function getValidAccessToken(): Promise<string> {
  const tokens = await Settings.getGmailTokens();
  if (!tokens) {
    throw new Error('Gmail not connected');
  }

  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const expiryBuffer = 5 * 60 * 1000; // 5 minutes

  if (tokens.expiry < now + expiryBuffer) {
    return refreshAccessToken();
  }

  return tokens.accessToken;
}

// Check if Gmail is connected
export async function isConnected(): Promise<boolean> {
  return Settings.isGmailConnected();
}

// Check if Gmail credentials are configured
export async function hasCredentials(): Promise<boolean> {
  const credentials = await Settings.getGmailCredentials();
  return credentials !== null;
}

// Disconnect Gmail
export async function disconnect(): Promise<void> {
  await Settings.clearGmailConnection();
}

// Get authenticated Gmail client
export async function getGmailClient() {
  const accessToken = await getValidAccessToken();
  const credentials = await Settings.getGmailCredentials();

  if (!credentials) {
    throw new Error('Gmail credentials not configured');
  }

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
