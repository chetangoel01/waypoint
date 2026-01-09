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

// Specific settings helpers
export const Settings = {
  OPENAI_API_KEY: 'openai_api_key',
  
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
};
