import { Router } from 'express';
import profileRoutes from './profile.js';
import applicationsRoutes from './applications.js';
import documentsRoutes from './documents.js';
import generateRoutes from './generate.js';
import settingsRoutes from './settings.js';
import emailRoutes from './email.js';

const router = Router();

router.use('/profile', profileRoutes);
router.use('/applications', applicationsRoutes);
router.use('/documents', documentsRoutes);
router.use('/generate', generateRoutes);
router.use('/settings', settingsRoutes);
router.use('/email', emailRoutes);

export default router;
