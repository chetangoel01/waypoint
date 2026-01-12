import { Router, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import { AuthRequest } from '../middleware/auth.js';
import * as applicationsService from '../services/applications.js';

const router = Router();

// GET /api/applications - List all applications
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      status: req.query.status as string | undefined,
      company: req.query.company as string | undefined,
    };
    const applications = await applicationsService.getAll(req.supabase!, filters);
    res.json(success(applications));
  })
);

// GET /api/applications/:id - Get single application
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const application = await applicationsService.getById(req.supabase!, id);
    if (!application) {
      notFound('Application');
    }
    res.json(success(application));
  })
);

// POST /api/applications - Create application
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationsService.create(req.supabase!, req.body);
    res.status(201).json(success(application));
  })
);

// PUT /api/applications/:id - Update application
router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const application = await applicationsService.update(req.supabase!, id, req.body);
    res.json(success(application));
  })
);

// DELETE /api/applications/:id - Delete application
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await applicationsService.remove(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

// PATCH /api/applications/:id/status - Update status only
router.patch(
  '/:id/status',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const application = await applicationsService.updateStatus(req.supabase!, id, status);
    res.json(success(application));
  })
);

export default router;
