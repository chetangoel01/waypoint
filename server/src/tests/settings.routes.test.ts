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

const settingsService = {
  getAllSettings: vi.fn(),
  setSetting: vi.fn(),
  deleteSetting: vi.fn(),
  createSettingsHelper: vi.fn(),
  Settings: {
    OPENAI_API_KEY: 'openai_api_key',
  },
};

vi.mock('../services/settings.js', () => settingsService);

const decryptMock = vi.fn();
vi.mock('../utils/crypto.js', () => ({
  decrypt: decryptMock,
}));

const { default: app } = await import('../app.js');

describe('settings routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsService.createSettingsHelper.mockReturnValue({
      getApiKey: vi.fn().mockResolvedValue('sk-test'),
      setApiKey: vi.fn().mockResolvedValue(undefined),
      clearApiKey: vi.fn().mockResolvedValue(undefined),
      getStatusOptions: vi.fn().mockResolvedValue([]),
      setStatusOptions: vi.fn().mockResolvedValue(undefined),
      resetStatusOptions: vi.fn().mockResolvedValue(undefined),
      isKeyFromEnv: vi.fn().mockReturnValue(false),
      isEncryptionEnabled: vi.fn().mockReturnValue(true),
    });
  });

  it('returns masked settings', async () => {
    settingsService.getAllSettings.mockResolvedValue({
      openai_api_key: 'enc:secret',
      theme: 'system',
    });
    decryptMock.mockReturnValue('sk-test-1234');

    const response = await request(app).get('/api/settings');

    expect(response.status).toBe(200);
    expect(response.body.data.openai_api_key).toContain('1234');
    expect(response.body.data.openai_api_key).not.toContain('sk-test-1234');
    expect(response.body.data.api_key_set).toBe(true);
  });

  it('returns AI status', async () => {
    const response = await request(app).get('/api/settings/ai-status');

    expect(response.status).toBe(200);
    expect(response.body.data.configured).toBe(true);
    expect(response.body.data.encrypted).toBe(true);
  });

  it('rejects invalid API key format', async () => {
    const response = await request(app)
      .put('/api/settings/api-key')
      .send({ apiKey: 'short' });

    expect(response.status).toBe(400);
  });

  it('saves API key', async () => {
    const response = await request(app)
      .put('/api/settings/api-key')
      .send({ apiKey: 'sk-valid-key-1234567890' });

    expect(response.status).toBe(200);
    expect(response.body.data.keyPreview).toContain('7890');
  });

  it('clears API key', async () => {
    const response = await request(app).delete('/api/settings/api-key');

    expect(response.status).toBe(200);
    expect(response.body.data.message).toContain('removed');
  });

  it('updates status options', async () => {
    const statuses = [{ key: 'saved', label: 'Saved', color: 'gray' }] as const;
    const response = await request(app)
      .put('/api/settings/statuses')
      .send({ statuses });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(statuses);
  });

  it('sets a generic setting', async () => {
    const response = await request(app)
      .put('/api/settings/theme')
      .send({ value: 'system' });

    expect(response.status).toBe(200);
    expect(response.body.data.key).toBe('theme');
    expect(settingsService.setSetting).toHaveBeenCalledWith(authState.supabase, 'theme', 'system');
  });

  it('deletes a generic setting', async () => {
    const response = await request(app).delete('/api/settings/theme');

    expect(response.status).toBe(200);
    expect(settingsService.deleteSetting).toHaveBeenCalledWith(authState.supabase, 'theme');
  });
});
