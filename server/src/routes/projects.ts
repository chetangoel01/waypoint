import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as projectsService from '../services/projects.js';

const router = Router();

// GET /api/projects - List all projects
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const projects = projectsService.getAll();
    res.json(success(projects));
  })
);

// GET /api/projects/:id - Get single project
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const project = projectsService.getById(id);
    if (!project) {
      notFound('Project');
    }
    res.json(success(project));
  })
);

// POST /api/projects - Create project
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const project = projectsService.create(req.body);
    res.status(201).json(success(project));
  })
);

// PUT /api/projects/:id - Update project
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const project = projectsService.update(id, req.body);
    res.json(success(project));
  })
);

// DELETE /api/projects/:id - Delete project
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    projectsService.remove(id);
    res.json(success({ deleted: true }));
  })
);

export default router;
