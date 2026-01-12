import { SupabaseClient } from '@supabase/supabase-js';
import { encrypt, decrypt, isEncryptionEnabled } from '../utils/crypto.js';

// Get a setting by key
export async function getSetting(
  supabase: SupabaseClient,
  key: string
): Promise<string | null> {
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
export async function setSetting(
  supabase: SupabaseClient,
  key: string,
  value: string
): Promise<void> {
  const { error } = await supabase.from('settings').upsert(
    { key, value },
    { onConflict: 'user_id,key' }
  );

  if (error) {
    throw new Error(`Failed to set setting: ${error.message}`);
  }
}

// Delete a setting
export async function deleteSetting(
  supabase: SupabaseClient,
  key: string
): Promise<void> {
  const { error } = await supabase.from('settings').delete().eq('key', key);

  if (error) {
    throw new Error(`Failed to delete setting: ${error.message}`);
  }
}

// Get all settings
export async function getAllSettings(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
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
  GMAIL_LAST_SYNC: 'gmail_last_sync',
};

// Create Settings helper object that requires supabase client
export function createSettingsHelper(supabase: SupabaseClient) {
  return {
    ...KEYS,

    // Returns API key from env var first, then falls back to database (decrypted)
    async getApiKey(): Promise<string | null> {
      const envKey = process.env.OPENAI_API_KEY;
      if (envKey) {
        return envKey;
      }
      const encryptedKey = await getSetting(supabase, KEYS.OPENAI_API_KEY);
      if (!encryptedKey) {
        return null;
      }
      // Decrypt the stored key
      try {
        return decrypt(encryptedKey);
      } catch (err) {
        console.error('Failed to decrypt API key:', err);
        return null;
      }
    },

    isKeyFromEnv(): boolean {
      return !!process.env.OPENAI_API_KEY;
    },
    
    isEncryptionEnabled(): boolean {
      return isEncryptionEnabled();
    },

    async setApiKey(apiKey: string): Promise<void> {
      // Encrypt the API key before storing
      const encryptedKey = encrypt(apiKey);
      await setSetting(supabase, KEYS.OPENAI_API_KEY, encryptedKey);
    },

    async clearApiKey(): Promise<void> {
      await deleteSetting(supabase, KEYS.OPENAI_API_KEY);
    },

    async getStatusOptions(): Promise<StatusOption[]> {
      const saved = await getSetting(supabase, KEYS.STATUS_OPTIONS);
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
      await setSetting(supabase, KEYS.STATUS_OPTIONS, JSON.stringify(options));
    },

    async resetStatusOptions(): Promise<void> {
      await deleteSetting(supabase, KEYS.STATUS_OPTIONS);
    },

    async getLastSyncDate(): Promise<string | null> {
      return getSetting(supabase, KEYS.GMAIL_LAST_SYNC);
    },

    async setLastSyncDate(date: string): Promise<void> {
      await setSetting(supabase, KEYS.GMAIL_LAST_SYNC, date);
    },
  };
}

// Export KEYS for use in routes
export const Settings = KEYS;
