import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as educationService from '../services/education.js';

const router = Router();

// GET /api/education - List all education entries
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const education = educationService.getAll();
    res.json(success(education));
  })
);

// GET /api/education/:id - Get single education
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const education = educationService.getById(id);
    if (!education) {
      notFound('Education');
    }
    res.json(success(education));
  })
);

// POST /api/education - Create education
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const education = educationService.create(req.body);
    res.status(201).json(success(education));
  })
);

// PUT /api/education/:id - Update education
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const education = educationService.update(id, req.body);
    res.json(success(education));
  })
);

// DELETE /api/education/:id - Delete education
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    educationService.remove(id);
    res.json(success({ deleted: true }));
  })
);

export default router;
