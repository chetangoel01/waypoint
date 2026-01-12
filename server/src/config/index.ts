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

  // Database
  databasePath: process.env.DATABASE_PATH || './data/app.db',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  aiRateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit AI endpoints to 10 requests per minute
  },

  // Request limits
  maxRequestSize: '1mb',
};

// Validate required environment variables
export function validateEnv(): void {
  const warnings: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set - AI features will not work');
  }

  if (config.isProduction) {
    if (!process.env.CLIENT_URL) {
      warnings.push('CLIENT_URL not set in production - using default');
    }
    if (!process.env.SERVER_URL) {
      warnings.push('SERVER_URL not set in production - using default');
    }
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('');
  }
}

export default config;
