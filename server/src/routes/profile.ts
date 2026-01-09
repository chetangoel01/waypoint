import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as profileService from '../services/profile.js';

const router = Router();

// GET /api/profile - Get the user profile
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const profile = profileService.getProfile();
    if (!profile) {
      notFound('Profile');
    }
    res.json(success(profile));
  })
);

// PUT /api/profile - Update the user profile
router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const profile = profileService.updateProfile(req.body);
    res.json(success(profile));
  })
);

export default router;
