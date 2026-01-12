import db from '../db/index.js';

interface SettingRow {
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// Ensure settings table exists
function ensureTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
    AFTER UPDATE ON settings
    BEGIN
      UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
    END;
  `);
}

// Initialize table on module load
ensureTable();

// Get a setting by key
export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

// Set a setting
export function setSetting(key: string, value: string): void {
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

// Delete a setting
export function deleteSetting(key: string): void {
  db.prepare('DELETE FROM settings WHERE key = ?').run(key);
}

// Get all settings
export function getAllSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as SettingRow[];
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);
}

export interface StatusOption {
  key: string;
  label: string;
  color: 'gray' | 'blue' | 'amber' | 'green' | 'red';
}

// Default status options
const DEFAULT_STATUSES: StatusOption[] = [
  { key: 'saved', label: 'Saved', color: 'gray' },
  { key: 'applied', label: 'Applied', color: 'blue' },
  { key: 'phone_screen', label: 'Phone Screen', color: 'blue' },
  { key: 'interview', label: 'Interview', color: 'amber' },
  { key: 'offer', label: 'Offer', color: 'green' },
  { key: 'rejected', label: 'Rejected', color: 'red' },
  { key: 'withdrawn', label: 'Withdrawn', color: 'red' },
];

// Specific settings helpers
export const Settings = {
  OPENAI_API_KEY: 'openai_api_key',
  STATUS_OPTIONS: 'status_options',
  // Gmail OAuth settings
  GMAIL_CLIENT_ID: 'gmail_client_id',
  GMAIL_CLIENT_SECRET: 'gmail_client_secret',
  GMAIL_ACCESS_TOKEN: 'gmail_access_token',
  GMAIL_REFRESH_TOKEN: 'gmail_refresh_token',
  GMAIL_TOKEN_EXPIRY: 'gmail_token_expiry',
  GMAIL_USER_EMAIL: 'gmail_user_email',
  GMAIL_LAST_SYNC: 'gmail_last_sync',
  
  // Returns API key from env var first, then falls back to database
  getApiKey(): string | null {
    // Check environment variable first
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      return envKey;
    }
    // Fall back to database setting
    return getSetting(Settings.OPENAI_API_KEY);
  },
  
  // Check if key is from environment (read-only) vs database
  isKeyFromEnv(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },
  
  setApiKey(apiKey: string): void {
    setSetting(Settings.OPENAI_API_KEY, apiKey);
  },
  
  clearApiKey(): void {
    deleteSetting(Settings.OPENAI_API_KEY);
  },

  // Status options
  getStatusOptions(): StatusOption[] {
    const saved = getSetting(Settings.STATUS_OPTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_STATUSES;
      }
    }
    return DEFAULT_STATUSES;
  },

  setStatusOptions(options: StatusOption[]): void {
    setSetting(Settings.STATUS_OPTIONS, JSON.stringify(options));
  },

  resetStatusOptions(): void {
    deleteSetting(Settings.STATUS_OPTIONS);
  },

  // Gmail OAuth helpers
  getGmailCredentials(): { clientId: string; clientSecret: string } | null {
    const clientId = getSetting(Settings.GMAIL_CLIENT_ID);
    const clientSecret = getSetting(Settings.GMAIL_CLIENT_SECRET);
    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret };
  },

  setGmailCredentials(clientId: string, clientSecret: string): void {
    setSetting(Settings.GMAIL_CLIENT_ID, clientId);
    setSetting(Settings.GMAIL_CLIENT_SECRET, clientSecret);
  },

  getGmailTokens(): { accessToken: string; refreshToken: string; expiry: number } | null {
    const accessToken = getSetting(Settings.GMAIL_ACCESS_TOKEN);
    const refreshToken = getSetting(Settings.GMAIL_REFRESH_TOKEN);
    const expiry = getSetting(Settings.GMAIL_TOKEN_EXPIRY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken, expiry: expiry ? parseInt(expiry, 10) : 0 };
  },

  setGmailTokens(accessToken: string, refreshToken: string, expiry: number): void {
    setSetting(Settings.GMAIL_ACCESS_TOKEN, accessToken);
    setSetting(Settings.GMAIL_REFRESH_TOKEN, refreshToken);
    setSetting(Settings.GMAIL_TOKEN_EXPIRY, expiry.toString());
  },

  getGmailUserEmail(): string | null {
    return getSetting(Settings.GMAIL_USER_EMAIL);
  },

  setGmailUserEmail(email: string): void {
    setSetting(Settings.GMAIL_USER_EMAIL, email);
  },

  getLastSyncDate(): string | null {
    return getSetting(Settings.GMAIL_LAST_SYNC);
  },

  setLastSyncDate(date: string): void {
    setSetting(Settings.GMAIL_LAST_SYNC, date);
  },

  clearGmailConnection(): void {
    deleteSetting(Settings.GMAIL_ACCESS_TOKEN);
    deleteSetting(Settings.GMAIL_REFRESH_TOKEN);
    deleteSetting(Settings.GMAIL_TOKEN_EXPIRY);
    deleteSetting(Settings.GMAIL_USER_EMAIL);
    deleteSetting(Settings.GMAIL_LAST_SYNC);
  },

  isGmailConnected(): boolean {
    const tokens = this.getGmailTokens();
    return tokens !== null;
  },
};
