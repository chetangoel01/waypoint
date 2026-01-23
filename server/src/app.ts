import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errorHandler, error } from './middleware/response.js';
import { requestLogger } from './middleware/request-logger.js';
import config from './config/index.js';
import { openApiSpec } from './docs/openapi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Security headers with CSP configured for Supabase, PDF.js, and Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          'https://mxciucdeesxtxdvarkmc.supabase.co',
          'https://*.supabase.co',
          'https://unpkg.com',
        ],
        workerSrc: ["'self'", 'blob:', 'https://unpkg.com'],
      },
    },
  })
);

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

// API Documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Waypoint API Documentation',
}));

// Serve OpenAPI spec as JSON
app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// API routes
app.use('/api', routes);

// Serve static files from client/dist in production
if (config.isProduction) {
  const clientDistPath = resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));

  // Serve index.html for all non-API GET routes (SPA routing)
  // This must come after API routes but before error handler
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(resolve(clientDistPath, 'index.html'));
  });
}

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// 404 handler for API routes (only reached if no route matched)
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json(error('Not found'));
});

export default app;
