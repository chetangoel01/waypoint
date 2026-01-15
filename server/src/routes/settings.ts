import { Router, Response } from 'express';
import { asyncHandler, success } from '../middleware/response.js';
import { validateBody } from '../middleware/validate.js';
import { saveApiKeySchema, updateStatusesSchema } from '../schemas/index.js';
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
  validateBody(saveApiKeySchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { apiKey } = req.body;

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
    // Validate the statuses array from the request body
    const result = updateStatusesSchema.safeParse(req.body.statuses);
    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      res.status(400).json({ success: false, data: null, error: message });
      return;
    }

    const settingsHelper = createSettingsHelper(req.supabase!);
    await settingsHelper.setStatusOptions(result.data as StatusOption[]);
    res.json(success(result.data));
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
