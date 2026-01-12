import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
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
router.use('/profile', requireAuth, profileRoutes);
router.use('/applications', requireAuth, applicationsRoutes);
router.use('/documents', requireAuth, documentsRoutes);
router.use('/generate', requireAuth, generateRoutes);
router.use('/settings', requireAuth, settingsRoutes);
router.use('/email', requireAuth, emailRoutes);

export default router;
