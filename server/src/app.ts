import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler, error } from './middleware/response.js';
import config from './config/index.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: config.isProduction ? config.clientUrl : true,
  credentials: true,
};
app.use(cors(corsOptions));

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

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json(error('Not found'));
});

export default app;
