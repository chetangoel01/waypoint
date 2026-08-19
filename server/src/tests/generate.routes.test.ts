import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';

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

const aiService = {
  generateCoverLetter: vi.fn(),
  generateCustomResponse: vi.fn(),
  refineContent: vi.fn(),
  isAiConfigured: vi.fn(),
  getApplicantContext: vi.fn(),
  parseResume: vi.fn(),
};

vi.mock('../services/ai.js', () => aiService);

const { default: app } = await import('../app.js');

describe('generate routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates cover letter payload', async () => {
    const response = await request(app)
      .post('/api/generate/cover-letter')
      .send({});

    expect(response.status).toBe(400);
  });

  it('generates a cover letter', async () => {
    aiService.generateCoverLetter.mockResolvedValue({
      content: 'Hello',
      promptUsed: 'Prompt',
    });

    const response = await request(app)
      .post('/api/generate/cover-letter')
      .send({ applicationId: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data.content).toBe('Hello');
  });

  it('generates a custom response', async () => {
    aiService.generateCustomResponse.mockResolvedValue({
      content: 'Answer',
      promptUsed: 'Prompt',
    });

    const response = await request(app)
      .post('/api/generate/custom-response')
      .send({ applicationId: 1, question: 'Why?' });

    expect(response.status).toBe(200);
    expect(response.body.data.content).toBe('Answer');
  });

  it('refines content', async () => {
    aiService.refineContent.mockResolvedValue({
      content: 'Refined',
      promptUsed: 'Prompt',
    });

    const response = await request(app)
      .post('/api/generate/refine')
      .send({ content: 'Draft', instruction: 'Polish' });

    expect(response.status).toBe(200);
    expect(response.body.data.content).toBe('Refined');
  });

  it('returns AI status', async () => {
    aiService.isAiConfigured.mockResolvedValue(true);

    const response = await request(app).get('/api/generate/status');

    expect(response.status).toBe(200);
    expect(response.body.data.configured).toBe(true);
  });

  it('returns applicant context', async () => {
    aiService.getApplicantContext.mockResolvedValue('Context');

    const response = await request(app).get('/api/generate/context');

    expect(response.status).toBe(200);
    expect(response.body.data.context).toBe('Context');
  });

  it('parses resume text', async () => {
    aiService.parseResume.mockResolvedValue({ experience: [] });

    const response = await request(app)
      .post('/api/generate/parse-resume')
      .send({ resumeText: 'A'.repeat(200) });

    expect(response.status).toBe(200);
    expect(response.body.data.experience).toEqual([]);
  });
});
