import { Router } from 'express';
import { success, asyncHandler, validationError } from '../middleware/response.js';
import { Settings } from '../services/settings.js';
import * as gmailOAuth from '../services/gmail-oauth.js';
import * as emailSync from '../services/email-sync.js';
import type { EmailStatus } from '../types/index.js';

const router = Router();

// GET /api/email/status - Get Gmail connection status
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const status: EmailStatus = {
      connected: gmailOAuth.isConnected(),
      email: Settings.getGmailUserEmail() || undefined,
      lastSync: Settings.getLastSyncDate() || undefined,
      hasCredentials: gmailOAuth.hasCredentials(),
    };

    res.json(success(status));
  })
);

// PUT /api/email/credentials - Save Gmail OAuth credentials
router.put(
  '/credentials',
  asyncHandler(async (req, res) => {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return validationError('Client ID and Client Secret are required');
    }

    Settings.setGmailCredentials(clientId, clientSecret);

    res.json(success({ message: 'Credentials saved' }));
  })
);

// GET /api/email/auth-url - Get OAuth authorization URL
router.get(
  '/auth-url',
  asyncHandler(async (_req, res) => {
    if (!gmailOAuth.hasCredentials()) {
      return validationError(
        'Gmail credentials not configured. Please add Client ID and Client Secret first.'
      );
    }

    const url = gmailOAuth.getAuthUrl();
    res.json(success({ url }));
  })
);

// GET /api/email/callback - OAuth callback handler
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      // Redirect to settings page with error
      return res.redirect(
        `http://localhost:5173/settings?email_error=${encodeURIComponent(String(error))}`
      );
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(
        'http://localhost:5173/settings?email_error=No authorization code received'
      );
    }

    try {
      await gmailOAuth.exchangeCode(code);
      // Redirect to settings page with success
      res.redirect('http://localhost:5173/settings?email_connected=true');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect Gmail';
      res.redirect(
        `http://localhost:5173/settings?email_error=${encodeURIComponent(message)}`
      );
    }
  })
);

// POST /api/email/sync - Trigger email sync (simple, no progress)
router.post(
  '/sync',
  asyncHandler(async (_req, res) => {
    if (!gmailOAuth.isConnected()) {
      return validationError('Gmail not connected');
    }

    const result = await emailSync.syncEmails();
    res.json(success(result));
  })
);

// GET /api/email/sync-stream - Trigger email sync with SSE progress
router.get('/sync-stream', async (req, res) => {
  if (!gmailOAuth.isConnected()) {
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
    const result = await emailSync.syncEmails((progress) => {
      sendProgress({ type: 'progress', ...progress });
    });

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
  asyncHandler(async (_req, res) => {
    gmailOAuth.disconnect();
    res.json(success({ message: 'Gmail disconnected' }));
  })
);

// GET /api/email/history - Get processed email history
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const limit = parseInt(String(req.query.limit)) || 50;
    const history = emailSync.getProcessedEmails(limit);
    res.json(success(history));
  })
);

export default router;
