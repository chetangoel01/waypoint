import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import type { Application } from '../types/index.js';

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

const applicationsService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  updateStatus: vi.fn(),
};

vi.mock('../services/applications.js', () => applicationsService);

const { default: app } = await import('../app.js');

const baseApplication: Application = {
  id: 1,
  user_id: authState.user.id,
  company: 'Acme',
  role: 'Engineer',
  url: null,
  job_description: null,
  status: 'saved',
  date_saved: '2024-01-01',
  date_applied: null,
  contacts: null,
  notes: null,
  custom_statuses: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('applications routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists applications', async () => {
    applicationsService.getAll.mockResolvedValue([baseApplication]);

    const response = await request(app).get('/api/applications');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(applicationsService.getAll).toHaveBeenCalledWith(authState.supabase, {
      status: undefined,
      company: undefined,
    });
  });

  it('gets a single application', async () => {
    applicationsService.getById.mockResolvedValue(baseApplication);

    const response = await request(app).get('/api/applications/1');

    expect(response.status).toBe(200);
    expect(response.body.data.company).toBe('Acme');
    expect(applicationsService.getById).toHaveBeenCalledWith(authState.supabase, 1);
  });

  it('creates an application', async () => {
    applicationsService.create.mockResolvedValue(baseApplication);

    const response = await request(app)
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Engineer' });

    expect(response.status).toBe(201);
    expect(response.body.data.role).toBe('Engineer');
    expect(applicationsService.create).toHaveBeenCalled();
  });

  it('updates an application', async () => {
    applicationsService.update.mockResolvedValue({
      ...baseApplication,
      company: 'Updated',
    });

    const response = await request(app)
      .put('/api/applications/1')
      .send({ company: 'Updated' });

    expect(response.status).toBe(200);
    expect(response.body.data.company).toBe('Updated');
    expect(applicationsService.update).toHaveBeenCalledWith(authState.supabase, 1, {
      company: 'Updated',
    });
  });

  it('deletes an application', async () => {
    applicationsService.remove.mockResolvedValue(true);

    const response = await request(app).delete('/api/applications/1');

    expect(response.status).toBe(200);
    expect(response.body.data.deleted).toBe(true);
    expect(applicationsService.remove).toHaveBeenCalledWith(authState.supabase, 1);
  });

  it('updates application status', async () => {
    applicationsService.updateStatus.mockResolvedValue({
      ...baseApplication,
      status: 'applied',
    });

    const response = await request(app)
      .patch('/api/applications/1/status')
      .send({ status: 'applied' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('applied');
    expect(applicationsService.updateStatus).toHaveBeenCalledWith(authState.supabase, 1, 'applied');
  });

  it('returns 404 when application not found', async () => {
    applicationsService.getById.mockResolvedValue(null);

    const response = await request(app).get('/api/applications/999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('not found');
  });

  it('handles service errors gracefully', async () => {
    applicationsService.getAll.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/api/applications');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('filters applications by status', async () => {
    applicationsService.getAll.mockResolvedValue([baseApplication]);

    const response = await request(app).get('/api/applications?status=applied');

    expect(response.status).toBe(200);
    expect(applicationsService.getAll).toHaveBeenCalledWith(authState.supabase, {
      status: 'applied',
      company: undefined,
    });
  });

  it('filters applications by company', async () => {
    applicationsService.getAll.mockResolvedValue([baseApplication]);

    const response = await request(app).get('/api/applications?company=Acme');

    expect(response.status).toBe(200);
    expect(applicationsService.getAll).toHaveBeenCalledWith(authState.supabase, {
      status: undefined,
      company: 'Acme',
    });
  });

  it('handles invalid ID format', async () => {
    const response = await request(app).get('/api/applications/invalid');

    // ID parsing will result in NaN, service should handle it
    expect(applicationsService.getById).toHaveBeenCalled();
  });

  it('handles create service errors', async () => {
    applicationsService.create.mockRejectedValue(new Error('Validation failed'));

    const response = await request(app)
      .post('/api/applications')
      .send({ company: 'Acme' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('handles update service errors', async () => {
    applicationsService.update.mockRejectedValue(new Error('Update failed'));

    const response = await request(app)
      .put('/api/applications/1')
      .send({ company: 'Updated' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('handles delete service errors', async () => {
    applicationsService.remove.mockRejectedValue(new Error('Delete failed'));

    const response = await request(app).delete('/api/applications/1');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
