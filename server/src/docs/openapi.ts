import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Waypoint API',
    description: `
## Overview

Waypoint is a job application tracking and AI-powered content generation platform.

### Authentication

All endpoints (except \`/api/health\`) require authentication via Bearer token:

\`\`\`
Authorization: Bearer <supabase_access_token>
\`\`\`

### Rate Limits

- **General API**: 200 requests / 15 minutes
- **AI Endpoints**: 20 requests / 1 minute

Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`
- \`X-RateLimit-Remaining\`
- \`X-RateLimit-Reset\`
    `,
    version: '1.0.0',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Applications', description: 'Job application management' },
    { name: 'Documents', description: 'Document and version management' },
    { name: 'Profile', description: 'User profile management' },
    { name: 'Experience', description: 'Work experience management' },
    { name: 'Education', description: 'Education history management' },
    { name: 'Skills', description: 'Skills management' },
    { name: 'Projects', description: 'Projects management' },
    { name: 'Stories', description: 'STAR stories management' },
    { name: 'Generate', description: 'AI content generation' },
    { name: 'Settings', description: 'User settings and configuration' },
    { name: 'Email', description: 'Gmail integration' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object', nullable: true },
          error: { type: 'string', nullable: true },
        },
        required: ['success'],
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'string', format: 'uuid' },
          company: { type: 'string', example: 'Acme Corp' },
          role: { type: 'string', example: 'Software Engineer' },
          status: { type: 'string', example: 'applied' },
          url: { type: 'string', format: 'uri', nullable: true, example: 'https://acme.com/jobs/123' },
          job_description: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true, example: 'San Francisco, CA' },
          salary_min: { type: 'integer', nullable: true, example: 120000 },
          salary_max: { type: 'integer', nullable: true, example: 150000 },
          notes: { type: 'string', nullable: true },
          date_saved: { type: 'string', format: 'date' },
          date_applied: { type: 'string', format: 'date', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateApplication: {
        type: 'object',
        required: ['company', 'role'],
        properties: {
          company: { type: 'string', minLength: 1, maxLength: 255, example: 'Acme Corp' },
          role: { type: 'string', minLength: 1, maxLength: 255, example: 'Software Engineer' },
          status: { type: 'string', maxLength: 50, example: 'saved' },
          url: { type: 'string', format: 'uri', maxLength: 2048 },
          notes: { type: 'string', maxLength: 10000 },
          location: { type: 'string', maxLength: 255 },
          salary_min: { type: 'integer', minimum: 0 },
          salary_max: { type: 'integer', minimum: 0 },
          applied_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', example: '2024-01-15' },
          job_description: { type: 'string', maxLength: 50000 },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'string', format: 'uuid' },
          application_id: { type: 'integer', nullable: true },
          type: { type: 'string', enum: ['cover_letter', 'custom_question'] },
          question: { type: 'string', nullable: true },
          key_points: { type: 'array', items: { type: 'string' }, nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      DocumentWithVersions: {
        allOf: [
          { $ref: '#/components/schemas/Document' },
          {
            type: 'object',
            properties: {
              versions: {
                type: 'array',
                items: { $ref: '#/components/schemas/DocumentVersion' },
              },
            },
          },
        ],
      },
      CreateDocument: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['cover_letter', 'custom_question'] },
          application_id: { type: 'integer', nullable: true },
          question: { type: 'string', maxLength: 1000 },
          key_points: { type: 'array', items: { type: 'string', maxLength: 500 } },
        },
      },
      DocumentVersion: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          document_id: { type: 'integer' },
          version: { type: 'integer' },
          content: { type: 'string' },
          prompt_used: { type: 'string', nullable: true },
          is_ai_generated: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateDocumentVersion: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 100000 },
          prompt_used: { type: 'string', maxLength: 10000 },
          is_ai_generated: { type: 'boolean', default: true },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string', nullable: true, example: 'Jane Doe' },
          email: { type: 'string', format: 'email', nullable: true },
          phone: { type: 'string', nullable: true, example: '+1-555-123-4567' },
          location: { type: 'string', nullable: true, example: 'San Francisco, CA' },
          linkedin_url: { type: 'string', format: 'uri', nullable: true },
          github_url: { type: 'string', format: 'uri', nullable: true },
          portfolio_url: { type: 'string', format: 'uri', nullable: true },
          resume_text: { type: 'string', nullable: true },
          career_goals: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      UpdateProfile: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255 },
          email: { type: 'string', format: 'email', maxLength: 255 },
          phone: { type: 'string', maxLength: 50 },
          location: { type: 'string', maxLength: 255 },
          linkedin_url: { type: 'string', format: 'uri', maxLength: 500 },
          github_url: { type: 'string', format: 'uri', maxLength: 500 },
          portfolio_url: { type: 'string', format: 'uri', maxLength: 500 },
          resume_text: { type: 'string', maxLength: 100000 },
          career_goals: { type: 'string', maxLength: 5000 },
        },
      },
      WorkExperience: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          company: { type: 'string', example: 'Tech Corp' },
          role: { type: 'string', example: 'Senior Engineer' },
          start_date: { type: 'string', format: 'date', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          description: { type: 'string', nullable: true },
          achievements: { type: 'array', items: { type: 'string' }, nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateWorkExperience: {
        type: 'object',
        required: ['company', 'role'],
        properties: {
          company: { type: 'string', minLength: 1, maxLength: 255 },
          role: { type: 'string', minLength: 1, maxLength: 255 },
          start_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          end_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          description: { type: 'string', maxLength: 10000 },
          achievements: { type: 'array', items: { type: 'string', maxLength: 1000 } },
        },
      },
      Education: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          institution: { type: 'string', example: 'State University' },
          degree: { type: 'string', example: 'B.S.' },
          field: { type: 'string', nullable: true, example: 'Computer Science' },
          start_date: { type: 'string', format: 'date', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          gpa: { type: 'number', nullable: true, example: 3.8 },
          coursework: { type: 'array', items: { type: 'string' }, nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateEducation: {
        type: 'object',
        required: ['institution', 'degree'],
        properties: {
          institution: { type: 'string', minLength: 1, maxLength: 255 },
          degree: { type: 'string', minLength: 1, maxLength: 255 },
          field: { type: 'string', maxLength: 255 },
          start_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          end_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          gpa: { type: 'number', minimum: 0, maximum: 5 },
          coursework: { type: 'array', items: { type: 'string', maxLength: 255 } },
        },
      },
      Skill: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          category: { type: 'string', example: 'Languages' },
          name: { type: 'string', example: 'Python' },
          proficiency: { type: 'string', nullable: true, example: 'Expert' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateSkill: {
        type: 'object',
        required: ['category', 'name'],
        properties: {
          category: { type: 'string', minLength: 1, maxLength: 100 },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          proficiency: { type: 'string', maxLength: 50 },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Open Source CLI Tool' },
          description: { type: 'string', nullable: true },
          technologies: { type: 'array', items: { type: 'string' }, nullable: true },
          outcomes: { type: 'string', nullable: true },
          url: { type: 'string', format: 'uri', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateProject: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', maxLength: 5000 },
          technologies: { type: 'array', items: { type: 'string', maxLength: 100 } },
          outcomes: { type: 'string', maxLength: 5000 },
          url: { type: 'string', format: 'uri', maxLength: 500 },
        },
      },
      Story: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Led Critical Migration Project' },
          situation: { type: 'string', nullable: true },
          task: { type: 'string', nullable: true },
          action: { type: 'string', nullable: true },
          result: { type: 'string', nullable: true },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateStory: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          situation: { type: 'string', maxLength: 5000 },
          task: { type: 'string', maxLength: 5000 },
          action: { type: 'string', maxLength: 5000 },
          result: { type: 'string', maxLength: 5000 },
          tags: { type: 'array', items: { type: 'string', maxLength: 50 } },
        },
      },
      GenerateCoverLetter: {
        type: 'object',
        required: ['applicationId'],
        properties: {
          applicationId: { type: 'integer', minimum: 1 },
          additionalContext: { type: 'string', maxLength: 5000 },
          tone: { type: 'string', maxLength: 50, example: 'professional' },
        },
      },
      GenerateCustomResponse: {
        type: 'object',
        required: ['applicationId', 'question'],
        properties: {
          applicationId: { type: 'integer', minimum: 1 },
          question: { type: 'string', minLength: 1, maxLength: 2000 },
          maxLength: { type: 'integer', maximum: 5000 },
        },
      },
      RefineContent: {
        type: 'object',
        required: ['content', 'instruction'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 50000 },
          instruction: { type: 'string', minLength: 1, maxLength: 2000 },
        },
      },
      ParseResume: {
        type: 'object',
        required: ['resumeText'],
        properties: {
          resumeText: { type: 'string', minLength: 100, maxLength: 100000 },
        },
      },
      ParsedResumeData: {
        type: 'object',
        properties: {
          profile: {
            type: 'object',
            properties: {
              name: { type: 'string', nullable: true },
              email: { type: 'string', nullable: true },
              phone: { type: 'string', nullable: true },
              location: { type: 'string', nullable: true },
              linkedin_url: { type: 'string', nullable: true },
              github_url: { type: 'string', nullable: true },
              portfolio_url: { type: 'string', nullable: true },
              career_goals: { type: 'string', nullable: true },
            },
          },
          experience: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                company: { type: 'string' },
                role: { type: 'string' },
                start_date: { type: 'string', nullable: true },
                end_date: { type: 'string', nullable: true },
                description: { type: 'string', nullable: true },
                achievements: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          education: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                institution: { type: 'string' },
                degree: { type: 'string' },
                field: { type: 'string', nullable: true },
                start_date: { type: 'string', nullable: true },
                end_date: { type: 'string', nullable: true },
                gpa: { type: 'number', nullable: true },
              },
            },
          },
          skills: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                name: { type: 'string' },
                proficiency: { type: 'string', nullable: true },
              },
            },
          },
          projects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                technologies: { type: 'array', items: { type: 'string' } },
                outcomes: { type: 'string', nullable: true },
                url: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      StatusOption: {
        type: 'object',
        properties: {
          key: { type: 'string', pattern: '^[a-z_]+$', example: 'applied' },
          label: { type: 'string', example: 'Applied' },
          color: { type: 'string', enum: ['gray', 'blue', 'amber', 'green', 'red'] },
        },
      },
      SaveApiKey: {
        type: 'object',
        required: ['apiKey'],
        properties: {
          apiKey: {
            type: 'string',
            minLength: 20,
            pattern: '^sk-',
            description: 'OpenAI API key (must start with sk-)',
          },
        },
      },
      EmailStatus: {
        type: 'object',
        properties: {
          connected: { type: 'boolean' },
          email: { type: 'string', format: 'email' },
          lastSync: { type: 'string', format: 'date-time' },
          hasCredentials: { type: 'boolean' },
        },
      },
      SyncResult: {
        type: 'object',
        properties: {
          processedCount: { type: 'integer' },
          newApplications: { type: 'integer' },
          updatedApplications: { type: 'integer' },
          skipped: { type: 'integer' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          data: { type: 'object', nullable: true, example: null },
          error: { type: 'string', example: 'Error message' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid authentication',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, data: null, error: 'Missing authorization header' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, data: null, error: 'Application not found' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, data: null, error: 'company: Required' },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { success: false, data: null, error: 'Too many requests, please try again later' },
          },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the server is running',
        security: [],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', format: 'date-time' },
                        environment: { type: 'string', example: 'production' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/applications': {
      get: {
        tags: ['Applications'],
        summary: 'List applications',
        description: 'Get all job applications for the authenticated user',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
          { name: 'company', in: 'query', schema: { type: 'string' }, description: 'Filter by company' },
        ],
        responses: {
          '200': {
            description: 'List of applications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Applications'],
        summary: 'Create application',
        description: 'Create a new job application',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateApplication' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Application created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/applications/{id}': {
      get: {
        tags: ['Applications'],
        summary: 'Get application',
        description: 'Get a single application by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Application details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Applications'],
        summary: 'Update application',
        description: 'Update an existing application',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateApplication' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Application updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Applications'],
        summary: 'Delete application',
        description: 'Delete an application',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Application deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { deleted: { type: 'boolean', example: true } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/applications/{id}/status': {
      patch: {
        tags: ['Applications'],
        summary: 'Update application status',
        description: 'Update only the status of an application',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/documents': {
      get: {
        tags: ['Documents'],
        summary: 'List documents',
        description: 'Get all documents, optionally filtered by application',
        parameters: [
          { name: 'application_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by application' },
        ],
        responses: {
          '200': {
            description: 'List of documents',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/DocumentWithVersions' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Create document',
        description: 'Create a new document',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDocument' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Document created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Document' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'Get document',
        description: 'Get a document with all its versions',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Document with versions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DocumentWithVersions' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Documents'],
        summary: 'Update document',
        description: 'Update a document',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDocument' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Document updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Document' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Documents'],
        summary: 'Delete document',
        description: 'Delete a document and all its versions',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Document deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { deleted: { type: 'boolean', example: true } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/documents/{id}/versions': {
      get: {
        tags: ['Documents'],
        summary: 'List document versions',
        description: 'Get all versions of a document',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'List of versions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/DocumentVersion' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Add document version',
        description: 'Add a new version to a document',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDocumentVersion' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Version created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DocumentVersion' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get profile',
        description: 'Get user profile (creates one if it does not exist)',
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Profile' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Update profile',
        description: 'Update user profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfile' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Profile' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/profile/experience': {
      get: {
        tags: ['Experience'],
        summary: 'List work experience',
        responses: {
          '200': {
            description: 'List of work experiences',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/WorkExperience' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Experience'],
        summary: 'Add work experience',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateWorkExperience' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Experience created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/WorkExperience' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/profile/experience/{id}': {
      put: {
        tags: ['Experience'],
        summary: 'Update work experience',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWorkExperience' } } },
        },
        responses: {
          '200': {
            description: 'Experience updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/WorkExperience' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Experience'],
        summary: 'Delete work experience',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Experience deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/profile/education': {
      get: {
        tags: ['Education'],
        summary: 'List education',
        responses: {
          '200': {
            description: 'List of education entries',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Education' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Education'],
        summary: 'Add education',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEducation' } } },
        },
        responses: {
          '201': {
            description: 'Education created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Education' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/profile/education/{id}': {
      put: {
        tags: ['Education'],
        summary: 'Update education',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEducation' } } },
        },
        responses: {
          '200': {
            description: 'Education updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Education' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Education'],
        summary: 'Delete education',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Education deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/profile/skills': {
      get: {
        tags: ['Skills'],
        summary: 'List skills',
        responses: {
          '200': {
            description: 'List of skills',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Skills'],
        summary: 'Add skill',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSkill' } } },
        },
        responses: {
          '201': {
            description: 'Skill created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Skill' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/profile/skills/{id}': {
      put: {
        tags: ['Skills'],
        summary: 'Update skill',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSkill' } } },
        },
        responses: {
          '200': {
            description: 'Skill updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Skill' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Skills'],
        summary: 'Delete skill',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Skill deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/profile/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Add project',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProject' } } },
        },
        responses: {
          '201': {
            description: 'Project created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/profile/projects/{id}': {
      put: {
        tags: ['Projects'],
        summary: 'Update project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProject' } } },
        },
        responses: {
          '200': {
            description: 'Project updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Project deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/profile/stories': {
      get: {
        tags: ['Stories'],
        summary: 'List STAR stories',
        responses: {
          '200': {
            description: 'List of stories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Story' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Stories'],
        summary: 'Add STAR story',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStory' } } },
        },
        responses: {
          '201': {
            description: 'Story created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Story' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/profile/stories/{id}': {
      put: {
        tags: ['Stories'],
        summary: 'Update STAR story',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStory' } } },
        },
        responses: {
          '200': {
            description: 'Story updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Story' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Stories'],
        summary: 'Delete STAR story',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Story deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', properties: { deleted: { type: 'boolean', example: true } } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/generate/status': {
      get: {
        tags: ['Generate'],
        summary: 'Check AI status',
        description: 'Check if OpenAI API is configured',
        responses: {
          '200': {
            description: 'AI configuration status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { configured: { type: 'boolean' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/generate/context': {
      get: {
        tags: ['Generate'],
        summary: 'Get applicant context',
        description: 'Get the context that would be sent to AI',
        responses: {
          '200': {
            description: 'Applicant context',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { context: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/generate/cover-letter': {
      post: {
        tags: ['Generate'],
        summary: 'Generate cover letter',
        description: 'Generate a cover letter using AI (rate limited: 20/min)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateCoverLetter' } } },
        },
        responses: {
          '200': {
            description: 'Generated cover letter',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        content: { type: 'string' },
                        documentId: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/generate/custom-response': {
      post: {
        tags: ['Generate'],
        summary: 'Generate custom response',
        description: 'Generate a response to a custom application question',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateCustomResponse' } } },
        },
        responses: {
          '200': {
            description: 'Generated response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        content: { type: 'string' },
                        documentId: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/generate/refine': {
      post: {
        tags: ['Generate'],
        summary: 'Refine content',
        description: 'Refine/edit existing content using AI',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefineContent' } } },
        },
        responses: {
          '200': {
            description: 'Refined content',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { refinedContent: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/generate/parse-resume': {
      post: {
        tags: ['Generate'],
        summary: 'Parse resume',
        description: 'Parse resume text and extract structured data',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ParseResume' } } },
        },
        responses: {
          '200': {
            description: 'Parsed resume data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/ParsedResumeData' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
    },
    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get all settings',
        description: 'Get all user settings (API keys are masked)',
        responses: {
          '200': {
            description: 'User settings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object', additionalProperties: { type: 'string' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/settings/ai-status': {
      get: {
        tags: ['Settings'],
        summary: 'Get AI status',
        description: 'Check AI API key configuration status',
        responses: {
          '200': {
            description: 'AI status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        configured: { type: 'boolean' },
                        keyPreview: { type: 'string', example: '••••1234' },
                        source: { type: 'string', enum: ['env', 'database'] },
                        encrypted: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/settings/api-key': {
      put: {
        tags: ['Settings'],
        summary: 'Save API key',
        description: 'Save OpenAI API key (encrypted)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SaveApiKey' } } },
        },
        responses: {
          '200': {
            description: 'API key saved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        keyPreview: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Settings'],
        summary: 'Remove API key',
        description: 'Remove stored API key',
        responses: {
          '200': {
            description: 'API key removed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { message: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/settings/statuses': {
      get: {
        tags: ['Settings'],
        summary: 'Get status options',
        description: 'Get custom application status options',
        responses: {
          '200': {
            description: 'Status options',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/StatusOption' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Settings'],
        summary: 'Update status options',
        description: 'Update custom status options',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['statuses'],
                properties: {
                  statuses: { type: 'array', items: { $ref: '#/components/schemas/StatusOption' } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Statuses updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/StatusOption' } },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/settings/statuses/reset': {
      post: {
        tags: ['Settings'],
        summary: 'Reset statuses',
        description: 'Reset statuses to defaults',
        responses: {
          '200': {
            description: 'Statuses reset',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/StatusOption' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/settings/{key}': {
      put: {
        tags: ['Settings'],
        summary: 'Set setting',
        description: 'Set a generic setting value (cannot set openai_api_key)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['value'],
                properties: { value: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Setting saved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        key: { type: 'string' },
                        value: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Settings'],
        summary: 'Delete setting',
        description: 'Delete a setting (cannot delete openai_api_key)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Setting deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { message: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/email/status': {
      get: {
        tags: ['Email'],
        summary: 'Get email status',
        description: 'Check Gmail connection status',
        responses: {
          '200': {
            description: 'Email status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EmailStatus' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/email/auth-url': {
      get: {
        tags: ['Email'],
        summary: 'Get OAuth URL',
        description: 'Get Google OAuth authorization URL',
        responses: {
          '200': {
            description: 'OAuth URL',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { url: { type: 'string', format: 'uri' } },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/email/callback': {
      get: {
        tags: ['Email'],
        summary: 'OAuth callback',
        description: 'Handle Google OAuth callback (redirects to client)',
        security: [],
        parameters: [
          { name: 'code', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'error', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '302': { description: 'Redirect to client application' },
        },
      },
    },
    '/email/sync': {
      post: {
        tags: ['Email'],
        summary: 'Sync emails',
        description: 'Trigger email sync (processes job-related emails)',
        responses: {
          '200': {
            description: 'Sync result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/SyncResult' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/email/sync-stream': {
      get: {
        tags: ['Email'],
        summary: 'Sync emails (SSE)',
        description: 'Trigger email sync with Server-Sent Events for progress updates',
        responses: {
          '200': {
            description: 'SSE stream with progress updates',
            content: {
              'text/event-stream': {
                schema: { type: 'string' },
                example: 'data: {"type":"progress","stage":"processing","current":1,"total":25}\n\n',
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/email/disconnect': {
      delete: {
        tags: ['Email'],
        summary: 'Disconnect email',
        description: 'Disconnect Gmail integration',
        responses: {
          '200': {
            description: 'Disconnected',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: { message: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/email/history': {
      get: {
        tags: ['Email'],
        summary: 'Get email history',
        description: 'Get processed email history',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          '200': {
            description: 'Email history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          email_id: { type: 'string' },
                          processed_at: { type: 'string', format: 'date-time' },
                          is_job_related: { type: 'integer' },
                          application_id: { type: 'integer', nullable: true },
                          email_from: { type: 'string' },
                          email_subject: { type: 'string' },
                          email_date: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
};
