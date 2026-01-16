import { Router, Request, Response } from 'express';
import { success, asyncHandler, validationError } from '../middleware/response.js';
import { AuthRequest } from '../middleware/auth.js';
import { createSettingsHelper } from '../services/settings.js';
import * as gmailOAuth from '../services/gmail-oauth.js';
import * as emailSync from '../services/email-sync.js';
import config from '../config/index.js';
import supabase from '../db/index.js';
import type { EmailStatus, SyncProgress } from '../types/index.js';

const router = Router();

// Public router for OAuth callback (no auth required)
export const emailCallbackRouter = Router();

// GET /api/email/status - Get Gmail connection status
router.get(
  '/status',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const settingsHelper = createSettingsHelper(req.supabase!);

    const status: EmailStatus = {
      connected: await gmailOAuth.isConnected(req.supabase!, userId),
      email: (await gmailOAuth.getGmailUserEmail(req.supabase!, userId)) || undefined,
      lastSync: (await settingsHelper.getLastSyncDate()) || undefined,
      hasCredentials: gmailOAuth.hasCredentials(),
    };

    res.json(success(status));
  })
);

// GET /api/email/auth-url - Get OAuth authorization URL
router.get(
  '/auth-url',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!gmailOAuth.hasCredentials()) {
      return validationError(
        'Gmail credentials not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables.'
      );
    }

    const userId = req.user!.id;
    const url = gmailOAuth.getAuthUrl(userId);
    res.json(success({ url }));
  })
);

// GET /api/email/callback - OAuth callback handler (PUBLIC - no auth required)
// This is mounted separately without auth middleware since it's a redirect from Google
emailCallbackRouter.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, error, state } = req.query;

    if (error) {
      // Redirect to settings page with error
      return res.redirect(
        `${config.clientUrl}/settings?email_error=${encodeURIComponent(String(error))}`
      );
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(
        `${config.clientUrl}/settings?email_error=No authorization code received`
      );
    }

    // Validate state token and get associated user ID
    const stateToken = state as string;
    if (!stateToken) {
      return res.redirect(
        `${config.clientUrl}/settings?email_error=Missing state parameter`
      );
    }

    const userId = gmailOAuth.validateStateToken(stateToken);
    if (!userId) {
      return res.redirect(
        `${config.clientUrl}/settings?email_error=Invalid or expired state parameter`
      );
    }

    try {
      // Use service-level Supabase client (bypasses RLS, which is fine since we
      // verified the user ID via the validated OAuth state token)
      await gmailOAuth.exchangeCode(supabase, userId, code);
      // Redirect to settings page with success
      res.redirect(`${config.clientUrl}/settings?email_connected=true`);
    } catch {
      // Don't expose internal error details
      res.redirect(
        `${config.clientUrl}/settings?email_error=Failed to connect Gmail`
      );
    }
  })
);

// POST /api/email/sync - Trigger email sync (simple, no progress)
router.post(
  '/sync',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    if (!(await gmailOAuth.isConnected(req.supabase!, userId))) {
      return validationError('Gmail not connected');
    }

    const result = await emailSync.syncEmails(req.supabase!, userId);
    res.json(success(result));
  })
);

// GET /api/email/sync-stream - Trigger email sync with SSE progress
router.get('/sync-stream', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  if (!(await gmailOAuth.isConnected(req.supabase!, userId))) {
    res.status(400).json({ success: false, error: 'Gmail not connected' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send progress updates via SSE
  const sendProgress = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await emailSync.syncEmails(
      req.supabase!,
      userId,
      (progress: SyncProgress) => {
        sendProgress({ type: 'progress', ...progress });
      }
    );

    // Send final result
    sendProgress({ type: 'result', ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    sendProgress({ type: 'error', message });
  }

  res.end();
});

// DELETE /api/email/disconnect - Disconnect Gmail
router.delete(
  '/disconnect',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    await gmailOAuth.disconnect(req.supabase!, userId);
    res.json(success({ message: 'Gmail disconnected' }));
  })
);

// GET /api/email/history - Get processed email history
router.get(
  '/history',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(String(req.query.limit)) || 50;
    const history = await emailSync.getProcessedEmails(req.supabase!, limit);
    res.json(success(history));
  })
);

export default router;
