import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as documentsService from '../services/documents.js';

const router = Router();

// GET /api/documents - List all documents
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const applicationId = req.query.application_id
      ? parseInt(req.query.application_id as string, 10)
      : undefined;
    const documents = documentsService.getAll(applicationId);
    res.json(success(documents));
  })
);

// GET /api/documents/:id - Get single document with versions
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const document = documentsService.getWithVersions(id);
    if (!document) {
      notFound('Document');
    }
    res.json(success(document));
  })
);

// POST /api/documents - Create document
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const document = documentsService.create(req.body);
    res.status(201).json(success(document));
  })
);

// PUT /api/documents/:id - Update document
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const document = documentsService.update(id, req.body);
    res.json(success(document));
  })
);

// DELETE /api/documents/:id - Delete document
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    documentsService.remove(id);
    res.json(success({ deleted: true }));
  })
);

// GET /api/documents/:id/versions - Get all versions
router.get(
  '/:id/versions',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const doc = documentsService.getById(id);
    if (!doc) {
      notFound('Document');
    }
    const versions = documentsService.getVersions(id);
    res.json(success(versions));
  })
);

// POST /api/documents/:id/versions - Add new version
router.post(
  '/:id/versions',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const version = documentsService.addVersion(id, req.body);
    res.status(201).json(success(version));
  })
);

export default router;
