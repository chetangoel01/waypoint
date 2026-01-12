import { Router, Response } from 'express';
import { asyncHandler, success } from '../middleware/response.js';
import { AuthRequest } from '../middleware/auth.js';
import {
  Settings,
  getAllSettings,
  setSetting,
  deleteSetting,
  createSettingsHelper,
  type StatusOption,
} from '../services/settings.js';
import { decrypt } from '../utils/crypto.js';

const router = Router();

// GET /api/settings - get all settings (with sensitive values masked)
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await getAllSettings(req.supabase!);

    // Mask sensitive values
    const masked: Record<string, string | boolean> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (key === Settings.OPENAI_API_KEY) {
        // Decrypt and mask the API key for display
        if (value) {
          try {
            const decrypted = decrypt(value);
            masked[key] = '••••••••' + decrypted.slice(-4);
          } catch {
            masked[key] = '••••••••****';
          }
        } else {
          masked[key] = '';
        }
        masked['api_key_set'] = !!value;
      } else {
        masked[key] = value;
      }
    }

    res.json(success(masked));
  })
);

// GET /api/settings/ai-status - check if AI is configured
router.get(
  '/ai-status',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settingsHelper = createSettingsHelper(req.supabase!);
    const apiKey = await settingsHelper.getApiKey();
    const isFromEnv = settingsHelper.isKeyFromEnv();
    const encryptionEnabled = settingsHelper.isEncryptionEnabled();
    res.json(
      success({
        configured: !!apiKey,
        keyPreview: apiKey ? '••••' + apiKey.slice(-4) : null,
        source: isFromEnv ? 'env' : 'database',
        encrypted: !isFromEnv && encryptionEnabled,
      })
    );
  })
);

// PUT /api/settings/api-key - set OpenAI API key
router.put(
  '/api-key',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(400).json({ success: false, data: null, error: 'apiKey is required' });
      return;
    }

    // Basic validation - OpenAI API keys start with "sk-"
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid API key format. OpenAI API keys start with "sk-".',
      });
      return;
    }

    const settingsHelper = createSettingsHelper(req.supabase!);
    await settingsHelper.setApiKey(apiKey);

    res.json(
      success({
        message: 'API key saved successfully',
        keyPreview: '••••' + apiKey.slice(-4),
      })
    );
  })
);

// DELETE /api/settings/api-key - remove API key
router.delete(
  '/api-key',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settingsHelper = createSettingsHelper(req.supabase!);
    await settingsHelper.clearApiKey();
    res.json(success({ message: 'API key removed successfully' }));
  })
);

// GET /api/settings/statuses - get status options
router.get(
  '/statuses',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settingsHelper = createSettingsHelper(req.supabase!);
    const statuses = await settingsHelper.getStatusOptions();
    res.json(success(statuses));
  })
);

// PUT /api/settings/statuses - update status options
router.put(
  '/statuses',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { statuses } = req.body;

    if (!Array.isArray(statuses) || statuses.length === 0) {
      res
        .status(400)
        .json({ success: false, data: null, error: 'statuses must be a non-empty array' });
      return;
    }

    // Validate each status
    const validColors = ['gray', 'blue', 'amber', 'green', 'red'];
    for (const status of statuses) {
      if (!status.key || !status.label) {
        res
          .status(400)
          .json({ success: false, data: null, error: 'Each status must have a key and label' });
        return;
      }
      if (status.color && !validColors.includes(status.color)) {
        status.color = 'gray'; // Default to gray if invalid
      }
    }

    const settingsHelper = createSettingsHelper(req.supabase!);
    await settingsHelper.setStatusOptions(statuses as StatusOption[]);
    res.json(success(statuses));
  })
);

// POST /api/settings/statuses/reset - reset to defaults
router.post(
  '/statuses/reset',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settingsHelper = createSettingsHelper(req.supabase!);
    await settingsHelper.resetStatusOptions();
    const statuses = await settingsHelper.getStatusOptions();
    res.json(success(statuses));
  })
);

// PUT /api/settings/:key - set a generic setting
router.put(
  '/:key',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key } = req.params;
    const { value } = req.body;

    // Don't allow setting the API key through generic endpoint
    if (key === Settings.OPENAI_API_KEY) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Use PUT /api/settings/api-key to set the API key',
      });
      return;
    }

    if (value === undefined) {
      res.status(400).json({ success: false, data: null, error: 'value is required' });
      return;
    }

    await setSetting(req.supabase!, key, String(value));
    res.json(success({ key, value: String(value) }));
  })
);

// DELETE /api/settings/:key - delete a setting
router.delete(
  '/:key',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key } = req.params;

    // Don't allow deleting the API key through generic endpoint
    if (key === Settings.OPENAI_API_KEY) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Use DELETE /api/settings/api-key to remove the API key',
      });
      return;
    }

    await deleteSetting(req.supabase!, key);
    res.json(success({ message: `Setting '${key}' deleted` }));
  })
);

export default router;
