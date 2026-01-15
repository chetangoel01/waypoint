import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generalRateLimiter, aiRateLimiter } from '../middleware/rate-limit.js';
import profileRoutes from './profile.js';
import applicationsRoutes from './applications.js';
import documentsRoutes from './documents.js';
import generateRoutes from './generate.js';
import settingsRoutes from './settings.js';
import emailRoutes, { emailCallbackRouter } from './email.js';

const router = Router();

// Public routes (no auth required)
// Email OAuth callback - must be public since it's a redirect from Google
router.use('/email', emailCallbackRouter);

// Protected routes (require authentication)
// Rate limiting applied after auth so we can use user ID as the rate limit key
router.use('/profile', requireAuth, generalRateLimiter, profileRoutes);
router.use('/applications', requireAuth, generalRateLimiter, applicationsRoutes);
router.use('/documents', requireAuth, generalRateLimiter, documentsRoutes);
router.use('/generate', requireAuth, aiRateLimiter, generateRoutes);
router.use('/settings', requireAuth, generalRateLimiter, settingsRoutes);
router.use('/email', requireAuth, generalRateLimiter, emailRoutes);

export default router;
