import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import type { Document, DocumentVersion } from '../types/index.js';

const authState = {
  user: { id: 'user-123', email: 'user@example.com' },
  supabase: {},
};

type AuthRequest = Request & {
  user?: { id: string; email?: string };
  supabase?: object;
};

vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    authReq.user = authState.user;
    authReq.supabase = authState.supabase;
    next();
  },
}));

const documentsService = {
  getAll: vi.fn(),
  getWithVersions: vi.fn(),
  getById: vi.fn(),
  getVersions: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  addVersion: vi.fn(),
};

vi.mock('../services/documents.js', () => documentsService);

const { default: app } = await import('../app.js');

const baseDocument: Document = {
  id: 1,
  user_id: authState.user.id,
  application_id: null,
  type: 'cover_letter',
  question: null,
  key_points: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const baseVersion: DocumentVersion = {
  id: 10,
  document_id: 1,
  version: 1,
  content: 'Hello',
  prompt_used: null,
  is_ai_generated: false,
  created_at: '2024-01-01T00:00:00Z',
};

describe('documents routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists documents', async () => {
    documentsService.getAll.mockResolvedValue([{ ...baseDocument, versions: [baseVersion] }]);

    const response = await request(app).get('/api/documents');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(documentsService.getAll).toHaveBeenCalledWith(authState.supabase, undefined);
  });

  it('gets a document with versions', async () => {
    documentsService.getWithVersions.mockResolvedValue({
      ...baseDocument,
      versions: [baseVersion],
    });

    const response = await request(app).get('/api/documents/1');

    expect(response.status).toBe(200);
    expect(response.body.data.versions).toHaveLength(1);
    expect(documentsService.getWithVersions).toHaveBeenCalledWith(authState.supabase, 1);
  });

  it('creates a document', async () => {
    documentsService.create.mockResolvedValue(baseDocument);

    const response = await request(app)
      .post('/api/documents')
      .send({ type: 'cover_letter', application_id: null });

    expect(response.status).toBe(201);
    expect(response.body.data.type).toBe('cover_letter');
    expect(documentsService.create).toHaveBeenCalled();
  });

  it('updates a document', async () => {
    documentsService.update.mockResolvedValue({ ...baseDocument, question: 'Updated?' });

    const response = await request(app)
      .put('/api/documents/1')
      .send({ question: 'Updated?' });

    expect(response.status).toBe(200);
    expect(response.body.data.question).toBe('Updated?');
    expect(documentsService.update).toHaveBeenCalledWith(authState.supabase, 1, {
      question: 'Updated?',
    });
  });

  it('deletes a document', async () => {
    documentsService.remove.mockResolvedValue(true);

    const response = await request(app).delete('/api/documents/1');

    expect(response.status).toBe(200);
    expect(response.body.data.deleted).toBe(true);
    expect(documentsService.remove).toHaveBeenCalledWith(authState.supabase, 1);
  });

  it('lists document versions', async () => {
    documentsService.getById.mockResolvedValue(baseDocument);
    documentsService.getVersions.mockResolvedValue([baseVersion]);

    const response = await request(app).get('/api/documents/1/versions');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(documentsService.getVersions).toHaveBeenCalledWith(authState.supabase, 1);
  });

  it('adds a document version', async () => {
    documentsService.addVersion.mockResolvedValue(baseVersion);

    const response = await request(app)
      .post('/api/documents/1/versions')
      .send({ content: 'Hello', is_ai_generated: false });

    expect(response.status).toBe(201);
    expect(response.body.data.content).toBe('Hello');
    expect(documentsService.addVersion).toHaveBeenCalledWith(authState.supabase, 1, {
      content: 'Hello',
      is_ai_generated: false,
    });
  });

  it('returns 404 when document not found', async () => {
    documentsService.getWithVersions.mockResolvedValue(null);

    const response = await request(app).get('/api/documents/999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('validates document creation payload', async () => {
    const response = await request(app)
      .post('/api/documents')
      .send({});

    expect(response.status).toBe(400);
  });

  it('validates document type enum', async () => {
    const response = await request(app)
      .post('/api/documents')
      .send({
        application_id: 1,
        type: 'invalid_type',
      });

    expect(response.status).toBe(400);
  });

  it('validates version content length', async () => {
    const response = await request(app)
      .post('/api/documents/1/versions')
      .send({
        content: 'A'.repeat(100001), // Too long
        is_ai_generated: false,
      });

    expect(response.status).toBe(400);
  });

  it('handles service errors', async () => {
    documentsService.getAll.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/api/documents');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
