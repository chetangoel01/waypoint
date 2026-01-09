import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as skillsService from '../services/skills.js';

const router = Router();

// GET /api/skills - List all skills (grouped by category)
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const grouped = req.query.grouped !== 'false';
    if (grouped) {
      const skills = skillsService.getAllGrouped();
      res.json(success(skills));
    } else {
      const skills = skillsService.getAll();
      res.json(success(skills));
    }
  })
);

// GET /api/skills/category/:category - Get skills by category
router.get(
  '/category/:category',
  asyncHandler(async (req: Request, res: Response) => {
    const skills = skillsService.getByCategory(req.params.category);
    res.json(success(skills));
  })
);

// GET /api/skills/:id - Get single skill
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const skill = skillsService.getById(id);
    if (!skill) {
      notFound('Skill');
    }
    res.json(success(skill));
  })
);

// POST /api/skills - Create skill
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const skill = skillsService.create(req.body);
    res.status(201).json(success(skill));
  })
);

// PUT /api/skills/:id - Update skill
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const skill = skillsService.update(id, req.body);
    res.json(success(skill));
  })
);

// DELETE /api/skills/:id - Delete skill
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    skillsService.remove(id);
    res.json(success({ deleted: true }));
  })
);

// DELETE /api/skills/category/:category - Delete all skills in category
router.delete(
  '/category/:category',
  asyncHandler(async (req: Request, res: Response) => {
    const count = skillsService.removeByCategory(req.params.category);
    res.json(success({ deleted: count }));
  })
);

export default router;
