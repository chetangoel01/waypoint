import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, error } from './middleware/response.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() }, error: null });
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
