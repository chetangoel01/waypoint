import { describe, expect, it } from 'vitest';
import {
  createApplicationSchema,
  updateApplicationSchema,
  createExperienceSchema,
  createEducationSchema,
  createSkillSchema,
  createProjectSchema,
  createStorySchema,
  generateCoverLetterSchema,
  parseResumeSchema,
  saveApiKeySchema,
  updateStatusesSchema,
} from '../schemas/index.js';

describe('schemas', () => {
  describe('createApplicationSchema', () => {
    it('validates required fields', () => {
      const result = createApplicationSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing company', () => {
      const result = createApplicationSchema.safeParse({
        role: 'Engineer',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing role', () => {
      const result = createApplicationSchema.safeParse({
        company: 'Acme',
      });
      expect(result.success).toBe(false);
    });

    it('validates URL format', () => {
      const result = createApplicationSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
        url: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid URL', () => {
      const result = createApplicationSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });

    it('validates date format', () => {
      const result = createApplicationSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
        applied_date: '2024-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = createApplicationSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
        applied_date: '01/01/2024',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateApplicationSchema', () => {
    it('allows partial updates', () => {
      const result = updateApplicationSchema.safeParse({
        company: 'Updated',
      });
      expect(result.success).toBe(true);
    });

    it('allows empty object', () => {
      const result = updateApplicationSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createExperienceSchema', () => {
    it('validates required fields', () => {
      const result = createExperienceSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
      });
      expect(result.success).toBe(true);
    });

    it('validates date format', () => {
      const result = createExperienceSchema.safeParse({
        company: 'Acme',
        role: 'Engineer',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createEducationSchema', () => {
    it('validates required fields', () => {
      const result = createEducationSchema.safeParse({
        institution: 'University',
        degree: 'BS',
      });
      expect(result.success).toBe(true);
    });

    it('validates GPA range', () => {
      const result = createEducationSchema.safeParse({
        institution: 'University',
        degree: 'BS',
        gpa: 3.5,
      });
      expect(result.success).toBe(true);
    });

    it('rejects GPA out of range', () => {
      const result = createEducationSchema.safeParse({
        institution: 'University',
        degree: 'BS',
        gpa: 6.0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createSkillSchema', () => {
    it('validates required fields', () => {
      const result = createSkillSchema.safeParse({
        category: 'Programming',
        name: 'JavaScript',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createProjectSchema', () => {
    it('validates required fields', () => {
      const result = createProjectSchema.safeParse({
        name: 'Project',
      });
      expect(result.success).toBe(true);
    });

    it('validates URL format', () => {
      const result = createProjectSchema.safeParse({
        name: 'Project',
        url: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createStorySchema', () => {
    it('validates required fields', () => {
      const result = createStorySchema.safeParse({
        title: 'Story Title',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('generateCoverLetterSchema', () => {
    it('validates applicationId', () => {
      const result = generateCoverLetterSchema.safeParse({
        applicationId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid applicationId', () => {
      const result = generateCoverLetterSchema.safeParse({
        applicationId: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parseResumeSchema', () => {
    it('validates minimum length', () => {
      const result = parseResumeSchema.safeParse({
        resumeText: 'A'.repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it('rejects text too short', () => {
      const result = parseResumeSchema.safeParse({
        resumeText: 'Too short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects text too long', () => {
      const result = parseResumeSchema.safeParse({
        resumeText: 'A'.repeat(100001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('saveApiKeySchema', () => {
    it('validates API key format', () => {
      const result = saveApiKeySchema.safeParse({
        apiKey: 'sk-123456789012345678901234567890',
      });
      expect(result.success).toBe(true);
    });

    it('rejects key without sk- prefix', () => {
      const result = saveApiKeySchema.safeParse({
        apiKey: '123456789012345678901234567890',
      });
      expect(result.success).toBe(false);
    });

    it('rejects key too short', () => {
      const result = saveApiKeySchema.safeParse({
        apiKey: 'sk-short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateStatusesSchema', () => {
    it('validates status array', () => {
      const result = updateStatusesSchema.safeParse([
        {
          key: 'applied',
          label: 'Applied',
          color: 'blue',
        },
      ]);
      expect(result.success).toBe(true);
    });

    it('rejects empty array', () => {
      const result = updateStatusesSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it('validates key format', () => {
      const result = updateStatusesSchema.safeParse([
        {
          key: 'invalid-key-with-dashes',
          label: 'Label',
          color: 'blue',
        },
      ]);
      expect(result.success).toBe(false);
    });

    it('accepts valid key format', () => {
      const result = updateStatusesSchema.safeParse([
        {
          key: 'valid_key',
          label: 'Label',
          color: 'blue',
        },
      ]);
      expect(result.success).toBe(true);
    });
  });
});
