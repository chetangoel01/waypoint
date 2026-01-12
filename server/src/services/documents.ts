import { SupabaseClient } from '@supabase/supabase-js';
import { Document, DocumentVersion, DocumentType } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

export interface CreateDocumentData {
  application_id?: number | null;
  type: DocumentType;
  question?: string | null;
  key_points?: string[];
}

export interface UpdateDocumentData {
  application_id?: number | null;
  type?: DocumentType;
  question?: string | null;
  key_points?: string[];
}

export interface CreateVersionData {
  content: string;
  prompt_used?: string | null;
  is_ai_generated?: boolean;
}

const VALID_TYPES: DocumentType[] = ['cover_letter', 'custom_question'];

// Get all documents with latest version
export async function getAll(
  supabase: SupabaseClient,
  applicationId?: number
): Promise<(Document & { versions: DocumentVersion[] })[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (applicationId !== undefined) {
    query = query.eq('application_id', applicationId);
  }

  const { data: docs, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  // Get latest version for each document
  const results = await Promise.all(
    (docs || []).map(async (doc) => {
      const { data: versions } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', doc.id)
        .order('version', { ascending: false })
        .limit(1);

      return {
        ...doc,
        versions: versions || [],
      };
    })
  );

  return results;
}

// Get single document by ID
export async function getById(
  supabase: SupabaseClient,
  id: number
): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return data;
}

// Get document with all versions
export async function getWithVersions(
  supabase: SupabaseClient,
  id: number
): Promise<(Document & { versions: DocumentVersion[] }) | null> {
  const doc = await getById(supabase, id);
  if (!doc) return null;

  const versions = await getVersions(supabase, id);
  return { ...doc, versions };
}

// Create document
export async function create(
  supabase: SupabaseClient,
  data: CreateDocumentData
): Promise<Document> {
  if (!data.type || !VALID_TYPES.includes(data.type)) {
    validationError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const { data: created, error } = await supabase
    .from('documents')
    .insert({
      application_id: data.application_id || null,
      type: data.type,
      question: data.question || null,
      key_points: data.key_points || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return created;
}

// Update document
export async function update(
  supabase: SupabaseClient,
  id: number,
  data: UpdateDocumentData
): Promise<Document> {
  const existing = await getById(supabase, id);
  if (!existing) {
    notFound('Document');
  }

  if (data.type && !VALID_TYPES.includes(data.type)) {
    validationError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const updateData: Record<string, unknown> = {};

  if (data.application_id !== undefined) updateData.application_id = data.application_id;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.question !== undefined) updateData.question = data.question;
  if (data.key_points !== undefined) updateData.key_points = data.key_points;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const { data: updated, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return updated;
}

// Delete document
export async function remove(
  supabase: SupabaseClient,
  id: number
): Promise<boolean> {
  const existing = await getById(supabase, id);
  if (!existing) {
    notFound('Document');
  }

  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }

  return true;
}

// Get all versions for a document
export async function getVersions(
  supabase: SupabaseClient,
  documentId: number
): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch document versions: ${error.message}`);
  }

  return data || [];
}

// Add new version
export async function addVersion(
  supabase: SupabaseClient,
  documentId: number,
  data: CreateVersionData
): Promise<DocumentVersion> {
  const doc = await getById(supabase, documentId);
  if (!doc) {
    notFound('Document');
  }

  if (!data.content) {
    validationError('Content is required');
  }

  // Get the latest version number
  const { data: latestVersion } = await supabase
    .from('document_versions')
    .select('version')
    .eq('document_id', documentId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const newVersion = (latestVersion?.version || 0) + 1;

  const { data: created, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      version: newVersion,
      content: data.content,
      prompt_used: data.prompt_used || null,
      is_ai_generated: data.is_ai_generated ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add document version: ${error.message}`);
  }

  return created;
}
