// Centralized configuration for the application

export const config = {
  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  serverUrl: process.env.SERVER_URL || 'http://localhost:3001',

  // Client
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',

  // Security - encryption key for sensitive data (API keys)
  // Should be a random string, at least 32 characters
  encryptionKey: process.env.ENCRYPTION_KEY || '',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Rate limiting (user-based, falls back to IP for unauthenticated requests)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each user to 200 requests per windowMs
  },
  aiRateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // limit AI endpoints to 20 requests per minute per user
  },

  // Request limits
  maxRequestSize: '1mb',
};

// Validate required environment variables
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Supabase
  if (!process.env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  }
  if (!process.env.SUPABASE_SERVICE_KEY) {
    errors.push('SUPABASE_SERVICE_KEY is required');
  }

  // Production requirements
  if (config.isProduction) {
    if (!process.env.ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY is required in production - generate with: openssl rand -base64 32');
    }
    if (!process.env.CLIENT_URL) {
      warnings.push('CLIENT_URL not set in production - using default');
    }
    if (!process.env.SERVER_URL) {
      warnings.push('SERVER_URL not set in production - using default');
    }
  } else {
    // Development warnings
    if (!process.env.ENCRYPTION_KEY) {
      warnings.push('ENCRYPTION_KEY not set - sensitive data will be stored without encryption');
    }
  }

  // Optional warnings
  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set - users will need to provide their own API key');
  }

  if (errors.length > 0) {
    console.error('\n❌ Missing Required Environment Variables:');
    errors.forEach((e) => console.error(`   - ${e}`));
    console.error('');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('');
  }
}

export default config;
