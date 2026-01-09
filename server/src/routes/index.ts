import { Router } from 'express';
import profileRoutes from './profile.js';
import applicationsRoutes from './applications.js';
import documentsRoutes from './documents.js';
import experienceRoutes from './experience.js';
import educationRoutes from './education.js';
import skillsRoutes from './skills.js';
import projectsRoutes from './projects.js';
import storiesRoutes from './stories.js';
import generateRoutes from './generate.js';
import settingsRoutes from './settings.js';

const router = Router();

router.use('/profile', profileRoutes);
router.use('/applications', applicationsRoutes);
router.use('/documents', documentsRoutes);
router.use('/experience', experienceRoutes);
router.use('/education', educationRoutes);
router.use('/skills', skillsRoutes);
router.use('/projects', projectsRoutes);
router.use('/stories', storiesRoutes);
router.use('/generate', generateRoutes);
router.use('/settings', settingsRoutes);

export default router;
