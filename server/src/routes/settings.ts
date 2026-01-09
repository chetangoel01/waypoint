import { Router, Request, Response, NextFunction } from 'express';
import { success } from '../middleware/response.js';
import { Settings, getAllSettings, setSetting, deleteSetting } from '../services/settings.js';

const router = Router();

// GET /api/settings - get all settings (with sensitive values masked)
router.get('/', (_req: Request, res: Response) => {
  const settings = getAllSettings();
  
  // Mask sensitive values
  const masked: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (key === Settings.OPENAI_API_KEY) {
      // Only show if key is set, but mask the actual value
      masked[key] = value ? '••••••••' + value.slice(-4) : '';
      masked['api_key_set'] = !!value;
    } else {
      masked[key] = value;
    }
  }
  
  res.json(success(masked));
});

// GET /api/settings/ai-status - check if AI is configured
router.get('/ai-status', (_req: Request, res: Response) => {
  const apiKey = Settings.getApiKey();
  const isFromEnv = Settings.isKeyFromEnv();
  res.json(success({
    configured: !!apiKey,
    keyPreview: apiKey ? '••••' + apiKey.slice(-4) : null,
    source: isFromEnv ? 'env' : 'database',
  }));
});

// PUT /api/settings/api-key - set OpenAI API key
router.put('/api-key', (req: Request, res: Response, next: NextFunction) => {
  try {
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
        error: 'Invalid API key format. OpenAI API keys start with "sk-".' 
      });
      return;
    }

    Settings.setApiKey(apiKey);

    res.json(success({
      message: 'API key saved successfully',
      keyPreview: '••••' + apiKey.slice(-4),
    }));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/settings/api-key - remove API key
router.delete('/api-key', (_req: Request, res: Response) => {
  Settings.clearApiKey();
  res.json(success({ message: 'API key removed successfully' }));
});

// PUT /api/settings/:key - set a generic setting
router.put('/:key', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Don't allow setting the API key through generic endpoint
    if (key === Settings.OPENAI_API_KEY) {
      res.status(400).json({ 
        success: false, 
        data: null, 
        error: 'Use PUT /api/settings/api-key to set the API key' 
      });
      return;
    }

    if (value === undefined) {
      res.status(400).json({ success: false, data: null, error: 'value is required' });
      return;
    }

    setSetting(key, String(value));
    res.json(success({ key, value: String(value) }));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/settings/:key - delete a setting
router.delete('/:key', (req: Request, res: Response) => {
  const { key } = req.params;
  
  // Don't allow deleting the API key through generic endpoint
  if (key === Settings.OPENAI_API_KEY) {
    res.status(400).json({ 
      success: false, 
      data: null, 
      error: 'Use DELETE /api/settings/api-key to remove the API key' 
    });
    return;
  }

  deleteSetting(key);
  res.json(success({ message: `Setting '${key}' deleted` }));
});

export default router;
