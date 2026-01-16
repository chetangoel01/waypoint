import { Router, Response } from 'express';
import { asyncHandler, success } from '../middleware/response.js';
import { AuthRequest } from '../middleware/auth.js';
import * as profileService from '../services/profile.js';

const router = Router();

// GET /api/profile - Get the user profile
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await profileService.getOrCreateProfile(req.supabase!);
    res.json(success(profile));
  })
);

// PUT /api/profile - Update the user profile
router.put(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await profileService.updateProfile(req.supabase!, req.body);
    res.json(success(profile));
  })
);

// Work Experience routes
router.get(
  '/experience',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const experience = await profileService.getWorkExperience(req.supabase!);
    res.json(success(experience));
  })
);

router.post(
  '/experience',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const experience = await profileService.createWorkExperience(req.supabase!, req.body);
    res.status(201).json(success(experience));
  })
);

router.put(
  '/experience/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const experience = await profileService.updateWorkExperience(req.supabase!, id, req.body);
    res.json(success(experience));
  })
);

router.delete(
  '/experience/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteWorkExperience(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

// Education routes
router.get(
  '/education',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const education = await profileService.getEducation(req.supabase!);
    res.json(success(education));
  })
);

router.post(
  '/education',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const education = await profileService.createEducation(req.supabase!, req.body);
    res.status(201).json(success(education));
  })
);

router.put(
  '/education/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const education = await profileService.updateEducation(req.supabase!, id, req.body);
    res.json(success(education));
  })
);

router.delete(
  '/education/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteEducation(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

// Skills routes
router.get(
  '/skills',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const skills = await profileService.getSkills(req.supabase!);
    res.json(success(skills));
  })
);

router.post(
  '/skills',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const skill = await profileService.createSkill(req.supabase!, req.body);
    res.status(201).json(success(skill));
  })
);

router.put(
  '/skills/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const skill = await profileService.updateSkill(req.supabase!, id, req.body);
    res.json(success(skill));
  })
);

router.delete(
  '/skills/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteSkill(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

// Projects routes
router.get(
  '/projects',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const projects = await profileService.getProjects(req.supabase!);
    res.json(success(projects));
  })
);

router.post(
  '/projects',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await profileService.createProject(req.supabase!, req.body);
    res.status(201).json(success(project));
  })
);

router.put(
  '/projects/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const project = await profileService.updateProject(req.supabase!, id, req.body);
    res.json(success(project));
  })
);

router.delete(
  '/projects/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteProject(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

// Stories routes
router.get(
  '/stories',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stories = await profileService.getStories(req.supabase!);
    res.json(success(stories));
  })
);

router.post(
  '/stories',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const story = await profileService.createStory(req.supabase!, req.body);
    res.status(201).json(success(story));
  })
);

router.put(
  '/stories/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const story = await profileService.updateStory(req.supabase!, id, req.body);
    res.json(success(story));
  })
);

router.delete(
  '/stories/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteStory(req.supabase!, id);
    res.json(success({ deleted: true }));
  })
);

export default router;
