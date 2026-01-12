import supabase from '../db/index.js';
import { Application, ApplicationStatusOption, Contact } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

export interface CreateApplicationData {
  company: string;
  role: string;
  url?: string | null;
  job_description?: string | null;
  status?: string;
  date_applied?: string | null;
  contacts?: Contact[];
  notes?: string | null;
  custom_statuses?: ApplicationStatusOption[];
}

export interface UpdateApplicationData {
  company?: string;
  role?: string;
  url?: string | null;
  job_description?: string | null;
  status?: string;
  date_applied?: string | null;
  contacts?: Contact[];
  notes?: string | null;
  custom_statuses?: ApplicationStatusOption[];
}

export interface ApplicationFilters {
  status?: string;
  company?: string;
}

// Get all applications with optional filters
export async function getAll(filters?: ApplicationFilters): Promise<Application[]> {
  let query = supabase
    .from('applications')
    .select('*')
    .order('date_saved', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.company) {
    query = query.ilike('company', `%${filters.company}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data || [];
}

// Get single application by ID
export async function getById(id: number): Promise<Application | null> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  return data;
}

// Create new application
export async function create(data: CreateApplicationData): Promise<Application> {
  if (!data.company || !data.role) {
    validationError('Company and role are required');
  }

  const { data: created, error } = await supabase
    .from('applications')
    .insert({
      company: data.company,
      role: data.role,
      url: data.url || null,
      job_description: data.job_description || null,
      status: data.status || 'saved',
      date_applied: data.date_applied || null,
      contacts: data.contacts || null,
      notes: data.notes || null,
      custom_statuses: data.custom_statuses || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create application: ${error.message}`);
  }

  return created;
}

// Update application
export async function update(id: number, data: UpdateApplicationData): Promise<Application> {
  const existing = await getById(id);
  if (!existing) {
    notFound('Application');
  }

  const updateData: Record<string, unknown> = {};

  if (data.company !== undefined) updateData.company = data.company;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.job_description !== undefined) updateData.job_description = data.job_description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.date_applied !== undefined) updateData.date_applied = data.date_applied;
  if (data.contacts !== undefined) updateData.contacts = data.contacts;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.custom_statuses !== undefined) updateData.custom_statuses = data.custom_statuses;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const { data: updated, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return updated;
}

// Delete application
export async function remove(id: number): Promise<boolean> {
  const existing = await getById(id);
  if (!existing) {
    notFound('Application');
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }

  return true;
}

// Update status only
export async function updateStatus(id: number, status: string): Promise<Application> {
  const existing = await getById(id);
  if (!existing) {
    notFound('Application');
  }

  const { data: updated, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`);
  }

  return updated;
}
