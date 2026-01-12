import { Router, Request, Response } from 'express';
import { asyncHandler, success, notFound } from '../middleware/response.js';
import * as profileService from '../services/profile.js';

const router = Router();

// GET /api/profile - Get the user profile
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const profile = await profileService.getProfile();
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
    const profile = await profileService.updateProfile(req.body);
    res.json(success(profile));
  })
);

// Work Experience routes
router.get(
  '/experience',
  asyncHandler(async (_req: Request, res: Response) => {
    const experience = await profileService.getWorkExperience();
    res.json(success(experience));
  })
);

router.post(
  '/experience',
  asyncHandler(async (req: Request, res: Response) => {
    const experience = await profileService.createWorkExperience(req.body);
    res.status(201).json(success(experience));
  })
);

router.put(
  '/experience/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const experience = await profileService.updateWorkExperience(id, req.body);
    res.json(success(experience));
  })
);

router.delete(
  '/experience/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteWorkExperience(id);
    res.json(success({ deleted: true }));
  })
);

// Education routes
router.get(
  '/education',
  asyncHandler(async (_req: Request, res: Response) => {
    const education = await profileService.getEducation();
    res.json(success(education));
  })
);

router.post(
  '/education',
  asyncHandler(async (req: Request, res: Response) => {
    const education = await profileService.createEducation(req.body);
    res.status(201).json(success(education));
  })
);

router.put(
  '/education/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const education = await profileService.updateEducation(id, req.body);
    res.json(success(education));
  })
);

router.delete(
  '/education/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteEducation(id);
    res.json(success({ deleted: true }));
  })
);

// Skills routes
router.get(
  '/skills',
  asyncHandler(async (_req: Request, res: Response) => {
    const skills = await profileService.getSkills();
    res.json(success(skills));
  })
);

router.post(
  '/skills',
  asyncHandler(async (req: Request, res: Response) => {
    const skill = await profileService.createSkill(req.body);
    res.status(201).json(success(skill));
  })
);

router.put(
  '/skills/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const skill = await profileService.updateSkill(id, req.body);
    res.json(success(skill));
  })
);

router.delete(
  '/skills/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteSkill(id);
    res.json(success({ deleted: true }));
  })
);

// Projects routes
router.get(
  '/projects',
  asyncHandler(async (_req: Request, res: Response) => {
    const projects = await profileService.getProjects();
    res.json(success(projects));
  })
);

router.post(
  '/projects',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await profileService.createProject(req.body);
    res.status(201).json(success(project));
  })
);

router.put(
  '/projects/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const project = await profileService.updateProject(id, req.body);
    res.json(success(project));
  })
);

router.delete(
  '/projects/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteProject(id);
    res.json(success({ deleted: true }));
  })
);

// Stories routes
router.get(
  '/stories',
  asyncHandler(async (_req: Request, res: Response) => {
    const stories = await profileService.getStories();
    res.json(success(stories));
  })
);

router.post(
  '/stories',
  asyncHandler(async (req: Request, res: Response) => {
    const story = await profileService.createStory(req.body);
    res.status(201).json(success(story));
  })
);

router.put(
  '/stories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const story = await profileService.updateStory(id, req.body);
    res.json(success(story));
  })
);

router.delete(
  '/stories/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    await profileService.deleteStory(id);
    res.json(success({ deleted: true }));
  })
);

export default router;
