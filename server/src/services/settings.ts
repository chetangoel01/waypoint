import supabase from '../db/index.js';

// Get a setting by key
export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get setting: ${error.message}`);
  }

  return data?.value ?? null;
}

// Set a setting
export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('settings').upsert(
    { key, value },
    { onConflict: 'key' }
  );

  if (error) {
    throw new Error(`Failed to set setting: ${error.message}`);
  }
}

// Delete a setting
export async function deleteSetting(key: string): Promise<void> {
  const { error } = await supabase.from('settings').delete().eq('key', key);

  if (error) {
    throw new Error(`Failed to delete setting: ${error.message}`);
  }
}

// Get all settings
export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('settings').select('key, value');

  if (error) {
    throw new Error(`Failed to get all settings: ${error.message}`);
  }

  return (data || []).reduce(
    (acc, row) => {
      acc[row.key] = row.value;
      return acc;
    },
    {} as Record<string, string>
  );
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

// Settings keys
const KEYS = {
  OPENAI_API_KEY: 'openai_api_key',
  STATUS_OPTIONS: 'status_options',
  GMAIL_CLIENT_ID: 'gmail_client_id',
  GMAIL_CLIENT_SECRET: 'gmail_client_secret',
  GMAIL_ACCESS_TOKEN: 'gmail_access_token',
  GMAIL_REFRESH_TOKEN: 'gmail_refresh_token',
  GMAIL_TOKEN_EXPIRY: 'gmail_token_expiry',
  GMAIL_USER_EMAIL: 'gmail_user_email',
  GMAIL_LAST_SYNC: 'gmail_last_sync',
};

// Specific settings helpers (now async)
export const Settings = {
  ...KEYS,

  // Returns API key from env var first, then falls back to database
  async getApiKey(): Promise<string | null> {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      return envKey;
    }
    return getSetting(KEYS.OPENAI_API_KEY);
  },

  isKeyFromEnv(): boolean {
    return !!process.env.OPENAI_API_KEY;
  },

  async setApiKey(apiKey: string): Promise<void> {
    await setSetting(KEYS.OPENAI_API_KEY, apiKey);
  },

  async clearApiKey(): Promise<void> {
    await deleteSetting(KEYS.OPENAI_API_KEY);
  },

  async getStatusOptions(): Promise<StatusOption[]> {
    const saved = await getSetting(KEYS.STATUS_OPTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_STATUSES;
      }
    }
    return DEFAULT_STATUSES;
  },

  async setStatusOptions(options: StatusOption[]): Promise<void> {
    await setSetting(KEYS.STATUS_OPTIONS, JSON.stringify(options));
  },

  async resetStatusOptions(): Promise<void> {
    await deleteSetting(KEYS.STATUS_OPTIONS);
  },

  async getGmailCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
    const clientId = await getSetting(KEYS.GMAIL_CLIENT_ID);
    const clientSecret = await getSetting(KEYS.GMAIL_CLIENT_SECRET);
    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret };
  },

  async setGmailCredentials(clientId: string, clientSecret: string): Promise<void> {
    await setSetting(KEYS.GMAIL_CLIENT_ID, clientId);
    await setSetting(KEYS.GMAIL_CLIENT_SECRET, clientSecret);
  },

  async getGmailTokens(): Promise<{
    accessToken: string;
    refreshToken: string;
    expiry: number;
  } | null> {
    const accessToken = await getSetting(KEYS.GMAIL_ACCESS_TOKEN);
    const refreshToken = await getSetting(KEYS.GMAIL_REFRESH_TOKEN);
    const expiry = await getSetting(KEYS.GMAIL_TOKEN_EXPIRY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken, expiry: expiry ? parseInt(expiry, 10) : 0 };
  },

  async setGmailTokens(
    accessToken: string,
    refreshToken: string,
    expiry: number
  ): Promise<void> {
    await setSetting(KEYS.GMAIL_ACCESS_TOKEN, accessToken);
    await setSetting(KEYS.GMAIL_REFRESH_TOKEN, refreshToken);
    await setSetting(KEYS.GMAIL_TOKEN_EXPIRY, expiry.toString());
  },

  async getGmailUserEmail(): Promise<string | null> {
    return getSetting(KEYS.GMAIL_USER_EMAIL);
  },

  async setGmailUserEmail(email: string): Promise<void> {
    await setSetting(KEYS.GMAIL_USER_EMAIL, email);
  },

  async getLastSyncDate(): Promise<string | null> {
    return getSetting(KEYS.GMAIL_LAST_SYNC);
  },

  async setLastSyncDate(date: string): Promise<void> {
    await setSetting(KEYS.GMAIL_LAST_SYNC, date);
  },

  async clearGmailConnection(): Promise<void> {
    await deleteSetting(KEYS.GMAIL_ACCESS_TOKEN);
    await deleteSetting(KEYS.GMAIL_REFRESH_TOKEN);
    await deleteSetting(KEYS.GMAIL_TOKEN_EXPIRY);
    await deleteSetting(KEYS.GMAIL_USER_EMAIL);
    await deleteSetting(KEYS.GMAIL_LAST_SYNC);
  },

  async isGmailConnected(): Promise<boolean> {
    const tokens = await this.getGmailTokens();
    return tokens !== null;
  },
};
