// Profile types
export interface Profile {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  career_goals: string | null;
  preferences: string | null;
  deal_breakers: string | null;
  additional_context: string | null;
  resume_text: string | null;
  created_at: string;
  updated_at: string;
}

// Work experience types
export interface WorkExperience {
  id: number;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  achievements: string[] | null;
  created_at: string;
  updated_at: string;
}

// Education types
export interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  gpa: number | null;
  coursework: string[] | null;
  created_at: string;
  updated_at: string;
}

// Skill types
export interface Skill {
  id: number;
  category: string;
  name: string;
  proficiency: string | null;
  created_at: string;
}

// Project types
export interface Project {
  id: number;
  name: string;
  description: string | null;
  technologies: string[] | null;
  outcomes: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

// Story types (STAR format)
export interface Story {
  id: number;
  title: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// Application types
export interface ApplicationStatusOption {
  key: string;
  label: string;
  color: 'gray' | 'blue' | 'amber' | 'green' | 'red';
}

export interface Application {
  id: number;
  company: string;
  role: string;
  url: string | null;
  job_description: string | null;
  status: string;
  date_saved: string;
  date_applied: string | null;
  contacts: Contact[] | null;
  notes: string | null;
  custom_statuses: ApplicationStatusOption[] | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  name: string;
  email?: string;
  linkedin?: string;
  role?: string;
}

// Document types
export type DocumentType = 'cover_letter' | 'custom_question';

export interface Document {
  id: number;
  application_id: number | null;
  type: DocumentType;
  question: string | null;
  key_points: string[] | null;
  created_at: string;
  updated_at: string;
}

// Document version types
export interface DocumentVersion {
  id: number;
  document_id: number;
  version: number;
  content: string;
  prompt_used: string | null;
  is_ai_generated: boolean;
  created_at: string;
}

// Email integration types
export interface EmailClassification {
  isJobRelated: boolean;
  confidence: number;
  reason: string;
}

export interface ExtractedJobInfo {
  company: string;
  role: string;
  status: 'saved' | 'applied' | 'rejected' | 'interview' | 'offer' | 'phone_screen';
  url?: string;
  contactName?: string;
  contactEmail?: string;
  jobDescription?: string;
}

export interface ProcessedEmail {
  id: number;
  email_id: string;
  processed_at: string;
  is_job_related: number;
  application_id: number | null;
  email_from: string | null;
  email_subject: string | null;
  email_date: string | null;
}

export interface SyncResult {
  processedCount: number;
  newApplications: number;
  updatedApplications: number;
  skipped: number;
  errors: string[];
}

export interface EmailStatus {
  connected: boolean;
  email?: string;
  lastSync?: string;
  hasCredentials: boolean;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  body: string;
}

export interface SyncProgress {
  stage: 'fetching' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  current: number;
  total: number;
  emailSubject?: string;
}
