import type {
  Application,
  Profile,
  Document,
  DocumentVersion,
  WorkExperience,
  Education,
  Skill,
  Project,
  Story,
  EmailStatus,
  SyncResult,
  ProcessedEmail,
} from '../types';

const API_BASE = '/api';

// Standard API response wrapper from backend
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
  error: string | null;
}

// API error class for better error handling
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json: ApiResponseWrapper<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(json.error || `HTTP error: ${response.status}`, response.status);
  }

  return json.data;
}

// Application endpoints
export const applicationsApi = {
  list: () => request<Application[]>('/applications'),
  get: (id: number) => request<Application>(`/applications/${id}`),
  create: (data: Omit<Application, 'id' | 'created_at' | 'updated_at'>) =>
    request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Application>) =>
    request<Application>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: Application['status']) =>
    request<Application>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    request<void>(`/applications/${id}`, {
      method: 'DELETE',
    }),
};

// Profile endpoints
export const profileApi = {
  get: () => request<Profile>('/profile'),
  update: (data: Partial<Profile>) =>
    request<Profile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Documents endpoints (with latest version included)
export const documentsApi = {
  list: (applicationId?: number) =>
    request<(Document & { versions: { id: number; document_id: number; version: number; content: string; prompt_used: string | null; is_ai_generated: boolean; created_at: string }[] })[]>(
      `/documents${applicationId ? `?application_id=${applicationId}` : ''}`
    ),
  get: (id: number) => request<Document & { versions: DocumentVersion[] }>(`/documents/${id}`),
  create: (data: Omit<Document, 'id' | 'created_at' | 'updated_at'>) =>
    request<Document>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Document>) =>
    request<Document>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/documents/${id}`, {
      method: 'DELETE',
    }),
  // Version endpoints
  addVersion: (documentId: number, data: { content: string; prompt_used?: string; is_ai_generated?: boolean }) =>
    request<DocumentVersion>(`/documents/${documentId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getVersions: (documentId: number) =>
    request<DocumentVersion[]>(`/documents/${documentId}/versions`),
};

// Work Experience endpoints
export const experienceApi = {
  list: () => request<WorkExperience[]>('/profile/experience'),
  get: (id: number) => request<WorkExperience>(`/profile/experience/${id}`),
  create: (data: Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>) =>
    request<WorkExperience>('/profile/experience', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<WorkExperience>) =>
    request<WorkExperience>(`/profile/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/profile/experience/${id}`, {
      method: 'DELETE',
    }),
};

// Education endpoints
export const educationApi = {
  list: () => request<Education[]>('/profile/education'),
  get: (id: number) => request<Education>(`/profile/education/${id}`),
  create: (data: Omit<Education, 'id' | 'created_at' | 'updated_at'>) =>
    request<Education>('/profile/education', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Education>) =>
    request<Education>(`/profile/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/profile/education/${id}`, {
      method: 'DELETE',
    }),
};

// Skills endpoints
export const skillsApi = {
  list: () => request<Skill[]>('/profile/skills'),
  create: (data: Omit<Skill, 'id' | 'created_at'>) =>
    request<Skill>('/profile/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Skill>) =>
    request<Skill>(`/profile/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/profile/skills/${id}`, {
      method: 'DELETE',
    }),
};

// Projects endpoints
export const projectsApi = {
  list: () => request<Project[]>('/profile/projects'),
  get: (id: number) => request<Project>(`/profile/projects/${id}`),
  create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) =>
    request<Project>('/profile/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Project>) =>
    request<Project>(`/profile/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/profile/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Stories endpoints
export const storiesApi = {
  list: () => request<Story[]>('/profile/stories'),
  get: (id: number) => request<Story>(`/profile/stories/${id}`),
  create: (data: Omit<Story, 'id' | 'created_at' | 'updated_at'>) =>
    request<Story>('/profile/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Story>) =>
    request<Story>(`/profile/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/profile/stories/${id}`, {
      method: 'DELETE',
    }),
};

// Health check
export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/health'),
};

// AI Generation types
export interface GenerationResult {
  content: string;
  promptUsed: string;
}

export type CoverLetterTone = 'professional' | 'conversational' | 'enthusiastic';

// AI Generation endpoints
export const generateApi = {
  coverLetter: (applicationId: number, options?: { additionalContext?: string; tone?: CoverLetterTone }) =>
    request<GenerationResult>('/generate/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ applicationId, ...options }),
    }),
  customResponse: (applicationId: number, question: string, options?: { additionalContext?: string; maxLength?: number }) =>
    request<GenerationResult>('/generate/custom-response', {
      method: 'POST',
      body: JSON.stringify({ applicationId, question, ...options }),
    }),
  refine: (content: string, instruction: string) =>
    request<GenerationResult>('/generate/refine', {
      method: 'POST',
      body: JSON.stringify({ content, instruction }),
    }),
  status: () => request<{ configured: boolean }>('/generate/status'),
  context: () => request<{ context: string }>('/generate/context'),
};

// Settings types
export interface AiStatus {
  configured: boolean;
  keyPreview: string | null;
  source: 'env' | 'database';
}

export interface StatusOption {
  key: string;
  label: string;
  color: 'gray' | 'blue' | 'amber' | 'green' | 'red';
}

// Settings endpoints
export const settingsApi = {
  getAll: () => request<Record<string, string | boolean>>('/settings'),
  getAiStatus: () => request<AiStatus>('/settings/ai-status'),
  setApiKey: (apiKey: string) =>
    request<{ message: string; keyPreview: string }>('/settings/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    }),
  clearApiKey: () =>
    request<{ message: string }>('/settings/api-key', {
      method: 'DELETE',
    }),
  getStatuses: () => request<StatusOption[]>('/settings/statuses'),
  setStatuses: (statuses: StatusOption[]) =>
    request<StatusOption[]>('/settings/statuses', {
      method: 'PUT',
      body: JSON.stringify({ statuses }),
    }),
  resetStatuses: () =>
    request<StatusOption[]>('/settings/statuses/reset', {
      method: 'POST',
    }),
};

// Email integration endpoints
export const emailApi = {
  getStatus: () => request<EmailStatus>('/email/status'),
  saveCredentials: (clientId: string, clientSecret: string) =>
    request<{ message: string }>('/email/credentials', {
      method: 'PUT',
      body: JSON.stringify({ clientId, clientSecret }),
    }),
  getAuthUrl: () => request<{ url: string }>('/email/auth-url'),
  sync: () => request<SyncResult>('/email/sync', { method: 'POST' }),
  disconnect: () =>
    request<{ message: string }>('/email/disconnect', {
      method: 'DELETE',
    }),
  getHistory: (limit?: number) =>
    request<ProcessedEmail[]>(`/email/history${limit ? `?limit=${limit}` : ''}`),
};
