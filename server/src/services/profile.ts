import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types/index.js';

export interface UpdateProfileData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  career_goals?: string | null;
  preferences?: string | null;
  deal_breakers?: string | null;
  additional_context?: string | null;
  resume_text?: string | null;
}

// Get the user's profile (RLS filters by user_id automatically)
export async function getProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

// Create profile for new user
export async function createProfile(
  supabase: SupabaseClient,
  data?: UpdateProfileData
): Promise<Profile> {
  const { data: created, error } = await supabase
    .from('profile')
    .insert(data || {})
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return created;
}

// Get or create profile (ensures user always has a profile)
export async function getOrCreateProfile(supabase: SupabaseClient): Promise<Profile> {
  const existing = await getProfile(supabase);
  if (existing) {
    return existing;
  }
  return createProfile(supabase);
}

// Update profile fields
export async function updateProfile(
  supabase: SupabaseClient,
  data: UpdateProfileData
): Promise<Profile> {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.linkedin_url !== undefined) updateData.linkedin_url = data.linkedin_url;
  if (data.github_url !== undefined) updateData.github_url = data.github_url;
  if (data.portfolio_url !== undefined) updateData.portfolio_url = data.portfolio_url;
  if (data.career_goals !== undefined) updateData.career_goals = data.career_goals;
  if (data.preferences !== undefined) updateData.preferences = data.preferences;
  if (data.deal_breakers !== undefined) updateData.deal_breakers = data.deal_breakers;
  if (data.additional_context !== undefined) updateData.additional_context = data.additional_context;
  if (data.resume_text !== undefined) updateData.resume_text = data.resume_text;

  if (Object.keys(updateData).length === 0) {
    const profile = await getOrCreateProfile(supabase);
    return profile;
  }

  // First ensure profile exists
  const existing = await getProfile(supabase);
  if (!existing) {
    // Create with the update data
    return createProfile(supabase, data);
  }

  const { data: updated, error } = await supabase
    .from('profile')
    .update(updateData)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return updated;
}

// Work Experience
export interface WorkExperience {
  id: number;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  achievements: string | null;
  created_at: string;
  updated_at: string;
}

export async function getWorkExperience(supabase: SupabaseClient): Promise<WorkExperience[]> {
  const { data, error } = await supabase
    .from('work_experience')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch work experience: ${error.message}`);
  }

  return data || [];
}

export async function createWorkExperience(
  supabase: SupabaseClient,
  exp: Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>
): Promise<WorkExperience> {
  const { data, error } = await supabase
    .from('work_experience')
    .insert(exp)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create work experience: ${error.message}`);
  }

  return data;
}

export async function updateWorkExperience(
  supabase: SupabaseClient,
  id: number,
  exp: Partial<Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>>
): Promise<WorkExperience> {
  const { data, error } = await supabase
    .from('work_experience')
    .update(exp)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update work experience: ${error.message}`);
  }

  return data;
}

export async function deleteWorkExperience(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from('work_experience').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete work experience: ${error.message}`);
  }
}

// Education
export interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string | null;
  start_date: string | null;
  end_date: string | null;
  gpa: number | null;
  coursework: string | null;
  created_at: string;
  updated_at: string;
}

export async function getEducation(supabase: SupabaseClient): Promise<Education[]> {
  const { data, error } = await supabase
    .from('education')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch education: ${error.message}`);
  }

  return data || [];
}

export async function createEducation(
  supabase: SupabaseClient,
  edu: Omit<Education, 'id' | 'created_at' | 'updated_at'>
): Promise<Education> {
  const { data, error } = await supabase.from('education').insert(edu).select().single();

  if (error) {
    throw new Error(`Failed to create education: ${error.message}`);
  }

  return data;
}

export async function updateEducation(
  supabase: SupabaseClient,
  id: number,
  edu: Partial<Omit<Education, 'id' | 'created_at' | 'updated_at'>>
): Promise<Education> {
  const { data, error } = await supabase
    .from('education')
    .update(edu)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update education: ${error.message}`);
  }

  return data;
}

export async function deleteEducation(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from('education').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete education: ${error.message}`);
  }
}

// Skills
export interface Skill {
  id: number;
  category: string;
  name: string;
  proficiency: string | null;
  created_at: string;
}

export async function getSkills(supabase: SupabaseClient): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch skills: ${error.message}`);
  }

  return data || [];
}

export async function createSkill(
  supabase: SupabaseClient,
  skill: Omit<Skill, 'id' | 'created_at'>
): Promise<Skill> {
  const { data, error } = await supabase.from('skills').insert(skill).select().single();

  if (error) {
    throw new Error(`Failed to create skill: ${error.message}`);
  }

  return data;
}

export async function deleteSkill(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from('skills').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete skill: ${error.message}`);
  }
}

export async function updateSkill(
  supabase: SupabaseClient,
  id: number,
  updates: Partial<Omit<Skill, 'id' | 'created_at'>>
): Promise<Skill> {
  const { data, error } = await supabase
    .from('skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update skill: ${error.message}`);
  }

  return data;
}

// Projects
export interface Project {
  id: number;
  name: string;
  description: string | null;
  technologies: string | null;
  outcomes: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProjects(supabase: SupabaseClient): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data || [];
}

export async function createProject(
  supabase: SupabaseClient,
  project: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(project).select().single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return data;
}

export async function updateProject(
  supabase: SupabaseClient,
  id: number,
  project: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(project)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

export async function deleteProject(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

// Stories
export interface Story {
  id: number;
  title: string;
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export async function getStories(supabase: SupabaseClient): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch stories: ${error.message}`);
  }

  return data || [];
}

export async function createStory(
  supabase: SupabaseClient,
  story: Omit<Story, 'id' | 'created_at' | 'updated_at'>
): Promise<Story> {
  const { data, error } = await supabase.from('stories').insert(story).select().single();

  if (error) {
    throw new Error(`Failed to create story: ${error.message}`);
  }

  return data;
}

export async function updateStory(
  supabase: SupabaseClient,
  id: number,
  story: Partial<Omit<Story, 'id' | 'created_at' | 'updated_at'>>
): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .update(story)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update story: ${error.message}`);
  }

  return data;
}

export async function deleteStory(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { error } = await supabase.from('stories').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete story: ${error.message}`);
  }
}
