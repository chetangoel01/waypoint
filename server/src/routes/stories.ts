import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as storiesService from '../services/stories.js';

const router = Router();

// GET /api/stories - List all stories
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const stories = storiesService.getAll();
    res.json(success(stories));
  })
);

// GET /api/stories/tag/:tag - Get stories by tag
router.get(
  '/tag/:tag',
  asyncHandler(async (req: Request, res: Response) => {
    const stories = storiesService.getByTag(req.params.tag);
    res.json(success(stories));
  })
);

// GET /api/stories/:id - Get single story
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const story = storiesService.getById(id);
    if (!story) {
      notFound('Story');
    }
    res.json(success(story));
  })
);

// POST /api/stories - Create story
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const story = storiesService.create(req.body);
    res.status(201).json(success(story));
  })
);

// PUT /api/stories/:id - Update story
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const story = storiesService.update(id, req.body);
    res.json(success(story));
  })
);

// DELETE /api/stories/:id - Delete story
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    storiesService.remove(id);
    res.json(success({ deleted: true }));
  })
);

export default router;
