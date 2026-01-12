import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as applicationsService from '../services/applications.js';

const router = Router();

// GET /api/applications - List all applications
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string | undefined,
      company: req.query.company as string | undefined,
    };
    const applications = await applicationsService.getAll(filters);
    res.json(success(applications));
  })
);

// GET /api/applications/:id - Get single application
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const application = await applicationsService.getById(id);
    if (!application) {
      notFound('Application');
    }
    res.json(success(application));
  })
);

// POST /api/applications - Create application
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationsService.create(req.body);
    res.status(201).json(success(application));
  })
);

// PUT /api/applications/:id - Update application
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const application = await applicationsService.update(id, req.body);
    res.json(success(application));
  })
);

// DELETE /api/applications/:id - Delete application
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await applicationsService.remove(id);
    res.json(success({ deleted: true }));
  })
);

// PATCH /api/applications/:id/status - Update status only
router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const application = await applicationsService.updateStatus(id, status);
    res.json(success(application));
  })
);

export default router;
