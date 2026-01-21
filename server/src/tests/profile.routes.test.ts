import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import type { Profile, WorkExperience, Education, Skill, Project, Story } from '../types/index.js';

const authState = {
  user: { id: 'user-123', email: 'user@example.com' },
  supabase: {},
};

type AuthRequest = Request & {
  user?: { id: string; email?: string };
  supabase?: object;
};

vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    authReq.user = authState.user;
    authReq.supabase = authState.supabase;
    next();
  },
}));

const profileService = {
  getOrCreateProfile: vi.fn(),
  updateProfile: vi.fn(),
  getWorkExperience: vi.fn(),
  createWorkExperience: vi.fn(),
  updateWorkExperience: vi.fn(),
  deleteWorkExperience: vi.fn(),
  getEducation: vi.fn(),
  createEducation: vi.fn(),
  updateEducation: vi.fn(),
  deleteEducation: vi.fn(),
  getSkills: vi.fn(),
  createSkill: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getStories: vi.fn(),
  createStory: vi.fn(),
  updateStory: vi.fn(),
  deleteStory: vi.fn(),
};

vi.mock('../services/profile.js', () => profileService);

const { default: app } = await import('../app.js');

const baseProfile: Profile = {
  id: 1,
  user_id: authState.user.id,
  name: 'Pat',
  email: 'pat@example.com',
  phone: null,
  location: null,
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  career_goals: null,
  preferences: null,
  deal_breakers: null,
  additional_context: null,
  resume_text: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const baseExperience: WorkExperience = {
  id: 1,
  user_id: authState.user.id,
  company: 'Acme',
  role: 'Engineer',
  start_date: '2022-01-01',
  end_date: null,
  description: null,
  achievements: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const baseEducation: Education = {
  id: 1,
  user_id: authState.user.id,
  institution: 'State University',
  degree: 'BS',
  field: 'CS',
  start_date: '2018-01-01',
  end_date: '2022-01-01',
  gpa: 3.8,
  coursework: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const baseSkill: Skill = {
  id: 1,
  user_id: authState.user.id,
  category: 'Languages',
  name: 'TypeScript',
  proficiency: 'Advanced',
  created_at: '2024-01-01T00:00:00Z',
};

const baseProject: Project = {
  id: 1,
  user_id: authState.user.id,
  name: 'Tracker',
  description: null,
  technologies: null,
  outcomes: null,
  url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const baseStory: Story = {
  id: 1,
  user_id: authState.user.id,
  title: 'Launch',
  situation: null,
  task: null,
  action: null,
  result: null,
  tags: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('profile routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets the profile', async () => {
    profileService.getOrCreateProfile.mockResolvedValue(baseProfile);

    const response = await request(app).get('/api/profile');

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('pat@example.com');
    expect(profileService.getOrCreateProfile).toHaveBeenCalledWith(authState.supabase);
  });

  it('updates the profile', async () => {
    profileService.updateProfile.mockResolvedValue({ ...baseProfile, name: 'Updated' });

    const response = await request(app)
      .put('/api/profile')
      .send({ name: 'Updated' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Updated');
    expect(profileService.updateProfile).toHaveBeenCalledWith(authState.supabase, {
      name: 'Updated',
    });
  });

  type ProfileServiceKey = keyof typeof profileService;
  type ResourceCase = {
    basePath: string;
    listMethod: ProfileServiceKey;
    createMethod: ProfileServiceKey;
    updateMethod: ProfileServiceKey;
    deleteMethod: ProfileServiceKey;
    sample: WorkExperience | Education | Skill | Project | Story;
    updatePayload: Record<string, string>;
  };

  const resourceCases: ResourceCase[] = [
    {
      basePath: '/api/profile/experience',
      listMethod: 'getWorkExperience',
      createMethod: 'createWorkExperience',
      updateMethod: 'updateWorkExperience',
      deleteMethod: 'deleteWorkExperience',
      sample: baseExperience,
      updatePayload: { role: 'Updated' },
    },
    {
      basePath: '/api/profile/education',
      listMethod: 'getEducation',
      createMethod: 'createEducation',
      updateMethod: 'updateEducation',
      deleteMethod: 'deleteEducation',
      sample: baseEducation,
      updatePayload: { degree: 'MS' },
    },
    {
      basePath: '/api/profile/skills',
      listMethod: 'getSkills',
      createMethod: 'createSkill',
      updateMethod: 'updateSkill',
      deleteMethod: 'deleteSkill',
      sample: baseSkill,
      updatePayload: { proficiency: 'Expert' },
    },
    {
      basePath: '/api/profile/projects',
      listMethod: 'getProjects',
      createMethod: 'createProject',
      updateMethod: 'updateProject',
      deleteMethod: 'deleteProject',
      sample: baseProject,
      updatePayload: { name: 'Updated' },
    },
    {
      basePath: '/api/profile/stories',
      listMethod: 'getStories',
      createMethod: 'createStory',
      updateMethod: 'updateStory',
      deleteMethod: 'deleteStory',
      sample: baseStory,
      updatePayload: { title: 'Updated' },
    },
  ];

  for (const resource of resourceCases) {
    it(`lists ${resource.basePath}`, async () => {
      profileService[resource.listMethod].mockResolvedValue([resource.sample]);

      const response = await request(app).get(resource.basePath);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it(`creates ${resource.basePath}`, async () => {
      profileService[resource.createMethod].mockResolvedValue(resource.sample);

      const response = await request(app)
        .post(resource.basePath)
        .send(resource.sample);

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe(resource.sample.id);
    });

    it(`updates ${resource.basePath}`, async () => {
      profileService[resource.updateMethod].mockResolvedValue({
        ...resource.sample,
        ...resource.updatePayload,
      });

      const response = await request(app)
        .put(`${resource.basePath}/1`)
        .send(resource.updatePayload);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(resource.sample.id);
    });

    it(`deletes ${resource.basePath}`, async () => {
      profileService[resource.deleteMethod].mockResolvedValue(undefined);

      const response = await request(app).delete(`${resource.basePath}/1`);

      expect(response.status).toBe(200);
      expect(response.body.data.deleted).toBe(true);
    });
  }
});
