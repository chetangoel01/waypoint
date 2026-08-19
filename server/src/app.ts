import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler, error } from './middleware/response.js';
import { requestLogger } from './middleware/request-logger.js';
import config from './config/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Security headers - configured for SPA
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - restrict to specific origins
const allowedOrigins = [config.clientUrl];
if (config.isDevelopment) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
app.use(cors(corsOptions));

// Request logging (after CORS, before routes)
app.use(requestLogger);

// Request size limits
app.use(express.json({ limit: config.maxRequestSize }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, data: null, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Stricter rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: config.aiRateLimit.windowMs,
  max: config.aiRateLimit.max,
  message: { success: false, data: null, error: 'AI rate limit exceeded, please wait before trying again' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/generate/', aiLimiter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
    error: null,
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Serve static files from client dist (production)
const clientDistPath = join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json(error('Not found'));
  }
  res.sendFile(join(clientDistPath, 'index.html'));
});

export default app;
