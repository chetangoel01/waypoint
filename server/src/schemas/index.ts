import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid ID format'),
});

export const paginationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : undefined),
  offset: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val, 10) : undefined),
});

// ============================================
// Application Schemas
// ============================================

export const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(255),
  role: z.string().min(1, 'Role is required').max(255),
  status: z.string().min(1).max(50).optional(),
  url: z.string().url().max(2048).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  salary_min: z.number().int().min(0).optional().nullable(),
  salary_max: z.number().int().min(0).optional().nullable(),
  applied_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  job_description: z.string().max(50000).optional().nullable(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const applicationQuerySchema = z.object({
  status: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

// ============================================
// Settings Schemas
// ============================================

export const saveApiKeySchema = z.object({
  apiKey: z.string()
    .min(20, 'API key is too short')
    .refine(val => val.startsWith('sk-'), 'Invalid API key format'),
});

const statusColorSchema = z.enum(['gray', 'blue', 'amber', 'green', 'red']);

export const updateStatusesSchema = z.array(
  z.object({
    key: z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Key must be lowercase with underscores'),
    label: z.string().min(1).max(50),
    color: statusColorSchema,
  })
).min(1, 'At least one status is required');

// ============================================
// Profile Schemas
// ============================================

export const updateProfileSchema = z.object({
  name: z.string().max(255).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  linkedin_url: z.string().url().max(500).optional().nullable(),
  github_url: z.string().url().max(500).optional().nullable(),
  portfolio_url: z.string().url().max(500).optional().nullable(),
  resume_text: z.string().max(100000).optional().nullable(),
  career_goals: z.string().max(5000).optional().nullable(),
});

// ============================================
// Experience Schemas
// ============================================

export const createExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required').max(255),
  role: z.string().min(1, 'Role is required').max(255),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  achievements: z.array(z.string().max(1000)).optional().nullable(),
});

export const updateExperienceSchema = createExperienceSchema.partial();

// ============================================
// Education Schemas
// ============================================

export const createEducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(255),
  degree: z.string().min(1, 'Degree is required').max(255),
  field: z.string().max(255).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gpa: z.number().min(0).max(5).optional().nullable(),
  coursework: z.array(z.string().max(255)).optional().nullable(),
});

export const updateEducationSchema = createEducationSchema.partial();

// ============================================
// Skills Schemas
// ============================================

export const createSkillSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  name: z.string().min(1, 'Name is required').max(100),
  proficiency: z.string().max(50).optional().nullable(),
});

export const updateSkillSchema = createSkillSchema.partial();

// ============================================
// Projects Schemas
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  technologies: z.array(z.string().max(100)).optional().nullable(),
  outcomes: z.string().max(5000).optional().nullable(),
  url: z.string().url().max(500).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================
// Stories Schemas
// ============================================

export const createStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  situation: z.string().max(5000).optional().nullable(),
  task: z.string().max(5000).optional().nullable(),
  action: z.string().max(5000).optional().nullable(),
  result: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().nullable(),
});

export const updateStorySchema = createStorySchema.partial();

// ============================================
// Generate Schemas
// ============================================

export const generateCoverLetterSchema = z.object({
  applicationId: z.number().int().positive(),
});

export const generateResumePointsSchema = z.object({
  applicationId: z.number().int().positive(),
  experienceId: z.number().int().positive().optional(),
});

export const generateInterviewPrepSchema = z.object({
  applicationId: z.number().int().positive(),
});

export const parseResumeSchema = z.object({
  resumeText: z.string()
    .min(100, 'Resume text is too short')
    .max(100000, 'Resume text is too long'),
});

// ============================================
// Document Schemas
// ============================================

export const createDocumentSchema = z.object({
  application_id: z.number().int().positive().nullable().optional(),
  type: z.enum(['cover_letter', 'custom_question']),
  question: z.string().max(1000).nullable().optional(),
  key_points: z.array(z.string().max(500)).nullable().optional(),
});

export const updateDocumentSchema = z.object({
  application_id: z.number().int().positive().nullable().optional(),
  type: z.enum(['cover_letter', 'custom_question']).optional(),
  question: z.string().max(1000).nullable().optional(),
  key_points: z.array(z.string().max(500)).nullable().optional(),
});

export const createDocumentVersionSchema = z.object({
  content: z.string().min(1).max(100000),
  prompt_used: z.string().max(10000).nullable().optional(),
  is_ai_generated: z.boolean().optional(),
});
