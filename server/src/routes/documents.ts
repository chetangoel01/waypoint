import { Router, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import { validateBody } from '../middleware/validate.js';
import { AuthRequest } from '../middleware/auth.js';
import * as documentsService from '../services/documents.js';
import { createDocumentSchema, updateDocumentSchema, createDocumentVersionSchema } from '../schemas/index.js';

const router = Router();

// GET /api/documents - List all documents
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const applicationId = req.query.application_id
      ? parseInt(req.query.application_id as string, 10)
      : undefined;
    const documents = await documentsService.getAll(req.supabase!, applicationId);
    res.json(success(documents));
  })
);

// GET /api/documents/:id - Get single document with versions
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const document = await documentsService.getWithVersions(req.supabase!, id);
    if (!document) {
      notFound('Document');
    }
    res.json(success(document));
  })
);

// POST /api/documents - Create document
router.post(
  '/',
  validateBody(createDocumentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const document = await documentsService.create(req.supabase!, req.body);
    res.status(201).json(success(document));
  })
);

// PUT /api/documents/:id - Update document
router.put(
  '/:id',
  validateBody(updateDocumentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const document = await documentsService.update(req.supabase!, id, req.body);
    res.json(success(document));
  })
);

// DELETE /api/documents/:id - Delete document
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await documentsService.remove(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

// GET /api/documents/:id/versions - Get all versions
router.get(
  '/:id/versions',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const doc = await documentsService.getById(req.supabase!, id);
    if (!doc) {
      notFound('Document');
    }
    const versions = await documentsService.getVersions(req.supabase!, id);
    res.json(success(versions));
  })
);

// POST /api/documents/:id/versions - Add new version
router.post(
  '/:id/versions',
  validateBody(createDocumentVersionSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const version = await documentsService.addVersion(req.supabase!, id, req.body);
    res.status(201).json(success(version));
  })
);

export default router;
