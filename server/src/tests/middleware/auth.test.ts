import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../config/index.js', () => ({
  default: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseServiceKey: 'test-service-key',
  },
}));

describe('requireAuth middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      ip: '127.0.0.1',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('rejects request without authorization header', async () => {
    await requireAuth(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Missing authorization header',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with invalid token format', async () => {
    req.headers = { authorization: 'InvalidFormat token123' };

    await requireAuth(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects request with invalid token', async () => {
    req.headers = { authorization: 'Bearer invalid-token' };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        }),
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    await requireAuth(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or expired token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts request with valid token', async () => {
    req.headers = { authorization: 'Bearer valid-token' };

    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    await requireAuth(req as AuthRequest, res as Response, next);

    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-key',
      expect.objectContaining({
        global: {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        },
      })
    );
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
    });
    expect(req.supabase).toBe(mockSupabase);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
