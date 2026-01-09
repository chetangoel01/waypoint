// Re-export types that mirror the server types
// These will be used for type-safe API responses

export type ApplicationStatus = 'saved' | 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface ApplicationStatusOption {
  key: string;
  label: string;
  color: 'gray' | 'blue' | 'amber' | 'green' | 'red';
}

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
  created_at: string;
  updated_at: string;
}

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

export interface Skill {
  id: number;
  category: string;
  name: string;
  proficiency: string | null;
  created_at: string;
}

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

export interface Contact {
  name: string;
  email?: string;
  linkedin?: string;
  role?: string;
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

export interface DocumentVersion {
  id: number;
  document_id: number;
  version: number;
  content: string;
  prompt_used: string | null;
  is_ai_generated: boolean;
  created_at: string;
}
