import { Router, Request, Response, NextFunction } from 'express';
import { success } from '../middleware/response.js';
import * as aiService from '../services/ai.js';

const router = Router();

// POST /api/generate/cover-letter
router.post('/cover-letter', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, additionalContext, tone } = req.body;

    if (!applicationId) {
      res.status(400).json({ success: false, data: null, error: 'applicationId is required' });
      return;
    }

    const result = await aiService.generateCoverLetter({
      applicationId,
      additionalContext,
      tone,
    });

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// POST /api/generate/custom-response
router.post('/custom-response', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, question, maxLength } = req.body;

    if (!applicationId) {
      res.status(400).json({ success: false, data: null, error: 'applicationId is required' });
      return;
    }

    if (!question) {
      res.status(400).json({ success: false, data: null, error: 'question is required' });
      return;
    }

    const result = await aiService.generateCustomResponse({
      applicationId,
      question,
      maxLength,
    });

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// POST /api/generate/refine
router.post('/refine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, instruction } = req.body;

    if (!content) {
      res.status(400).json({ success: false, data: null, error: 'content is required' });
      return;
    }

    if (!instruction) {
      res.status(400).json({ success: false, data: null, error: 'instruction is required' });
      return;
    }

    const result = await aiService.refineContent({
      content,
      instruction,
    });

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

// GET /api/generate/status - check if AI is configured
router.get('/status', (_req: Request, res: Response) => {
  res.json(success({
    configured: aiService.isAiConfigured(),
  }));
});

// GET /api/generate/context - get the applicant context that would be sent to AI
router.get('/context', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const context = await aiService.getApplicantContext();
    res.json(success({ context }));
  } catch (err) {
    next(err);
  }
});

export default router;
