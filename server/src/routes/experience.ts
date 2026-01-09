import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as experienceService from '../services/experience.js';

const router = Router();

// GET /api/experience - List all work experiences
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const experiences = experienceService.getAll();
    res.json(success(experiences));
  })
);

// GET /api/experience/:id - Get single experience
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const experience = experienceService.getById(id);
    if (!experience) {
      notFound('Work experience');
    }
    res.json(success(experience));
  })
);

// POST /api/experience - Create experience
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const experience = experienceService.create(req.body);
    res.status(201).json(success(experience));
  })
);

// PUT /api/experience/:id - Update experience
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const experience = experienceService.update(id, req.body);
    res.json(success(experience));
  })
);

// DELETE /api/experience/:id - Delete experience
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    experienceService.remove(id);
    res.json(success({ deleted: true }));
  })
);

export default router;
