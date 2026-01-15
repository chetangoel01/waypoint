import { Router, Response } from 'express';
import { z } from 'zod';
import { success, asyncHandler } from '../middleware/response.js';
import { validateBody } from '../middleware/validate.js';
import { parseResumeSchema } from '../schemas/index.js';
import { AuthRequest } from '../middleware/auth.js';
import * as aiService from '../services/ai.js';

const router = Router();

// Schemas for generate endpoints
const coverLetterSchema = z.object({
  applicationId: z.number().int().positive('applicationId is required'),
  additionalContext: z.string().max(5000).optional(),
  tone: z.string().max(50).optional(),
});

const customResponseSchema = z.object({
  applicationId: z.number().int().positive('applicationId is required'),
  question: z.string().min(1, 'question is required').max(2000),
  maxLength: z.number().int().positive().max(5000).optional(),
});

const refineSchema = z.object({
  content: z.string().min(1, 'content is required').max(50000),
  instruction: z.string().min(1, 'instruction is required').max(2000),
});

// POST /api/generate/cover-letter
router.post(
  '/cover-letter',
  validateBody(coverLetterSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId, additionalContext, tone } = req.body;

    const result = await aiService.generateCoverLetter(req.supabase!, {
      applicationId,
      additionalContext,
      tone,
    });

    res.json(success(result));
  })
);

// POST /api/generate/custom-response
router.post(
  '/custom-response',
  validateBody(customResponseSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId, question, maxLength } = req.body;

    const result = await aiService.generateCustomResponse(req.supabase!, {
      applicationId,
      question,
      maxLength,
    });

    res.json(success(result));
  })
);

// POST /api/generate/refine
router.post(
  '/refine',
  validateBody(refineSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content, instruction } = req.body;

    const result = await aiService.refineContent(req.supabase!, {
      content,
      instruction,
    });

    res.json(success(result));
  })
);

// GET /api/generate/status - check if AI is configured
router.get('/status', async (req: AuthRequest, res: Response) => {
  const configured = await aiService.isAiConfigured(req.supabase!);
  res.json(success({
    configured,
  }));
});

// GET /api/generate/context - get the applicant context that would be sent to AI
router.get(
  '/context',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const context = await aiService.getApplicantContext(req.supabase!);
    res.json(success({ context }));
  })
);

// POST /api/generate/parse-resume - parse resume text and extract structured data
router.post(
  '/parse-resume',
  validateBody(parseResumeSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { resumeText } = req.body;

    const result = await aiService.parseResume(req.supabase!, resumeText);
    res.json(success(result));
  })
);

export default router;
