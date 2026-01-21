import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import type { ProcessedEmail } from '../types/index.js';

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

const gmailOAuth = {
  isConnected: vi.fn(),
  getGmailUserEmail: vi.fn(),
  hasCredentials: vi.fn(),
  getAuthUrl: vi.fn(),
  validateStateToken: vi.fn(),
  exchangeCode: vi.fn(),
  disconnect: vi.fn(),
};

const emailSync = {
  syncEmails: vi.fn(),
  getProcessedEmails: vi.fn(),
};

const settingsService = {
  createSettingsHelper: vi.fn(),
};

vi.mock('../services/gmail-oauth.js', () => gmailOAuth);
vi.mock('../services/email-sync.js', () => emailSync);
vi.mock('../services/settings.js', () => settingsService);

const { default: app } = await import('../app.js');

describe('email routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsService.createSettingsHelper.mockReturnValue({
      getLastSyncDate: vi.fn().mockResolvedValue('2024-01-01T00:00:00Z'),
    });
  });

  it('returns email integration status', async () => {
    gmailOAuth.isConnected.mockResolvedValue(true);
    gmailOAuth.getGmailUserEmail.mockResolvedValue('user@example.com');
    gmailOAuth.hasCredentials.mockReturnValue(true);

    const response = await request(app).get('/api/email/status');

    expect(response.status).toBe(200);
    expect(response.body.data.connected).toBe(true);
    expect(response.body.data.email).toBe('user@example.com');
  });

  it('returns auth url when credentials exist', async () => {
    gmailOAuth.hasCredentials.mockReturnValue(true);
    gmailOAuth.getAuthUrl.mockReturnValue('https://example.com/auth');

    const response = await request(app).get('/api/email/auth-url');

    expect(response.status).toBe(200);
    expect(response.body.data.url).toContain('https://');
  });

  it('rejects auth url request when credentials are missing', async () => {
    gmailOAuth.hasCredentials.mockReturnValue(false);

    const response = await request(app).get('/api/email/auth-url');

    expect(response.status).toBe(400);
  });

  it('returns processed email history', async () => {
    const history: ProcessedEmail[] = [
      {
        id: 1,
        email_id: 'email-1',
        processed_at: '2024-01-01T00:00:00Z',
        is_job_related: 1,
        application_id: null,
        email_from: 'recruiter@example.com',
        email_subject: 'Update',
        email_date: '2024-01-01',
      },
    ];

    emailSync.getProcessedEmails.mockResolvedValue(history);

    const response = await request(app).get('/api/email/history');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('rejects sync if Gmail is not connected', async () => {
    gmailOAuth.isConnected.mockResolvedValue(false);

    const response = await request(app).post('/api/email/sync');

    expect(response.status).toBe(400);
  });
});
