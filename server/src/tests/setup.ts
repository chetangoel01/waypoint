import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root if it exists (for local development)
dotenv.config({ path: resolve(process.cwd(), '../.env') });

// Set default test environment variables only for local development
// In CI, these should be provided via GitHub secrets
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

if (!isCI) {
  // Only set defaults for local development
  if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
  }
  if (!process.env.SUPABASE_SERVICE_KEY) {
    process.env.SUPABASE_SERVICE_KEY = 'dummy-service-key-for-local-testing';
  }
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = 'dummy-encryption-key-for-testing-purposes-min-32-chars';
  }
}

// Always set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
