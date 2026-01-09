import db from '../db/index.js';
import { Document, DocumentVersion, DocumentType } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface DocumentRow {
  id: number;
  application_id: number | null;
  type: DocumentType;
  question: string | null;
  key_points: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentVersionRow {
  id: number;
  document_id: number;
  version: number;
  content: string;
  prompt_used: string | null;
  is_ai_generated: number;
  created_at: string;
}

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

function parseDocument(row: DocumentRow): Document {
  return {
    ...row,
    key_points: row.key_points ? JSON.parse(row.key_points) : null,
  };
}

function parseVersion(row: DocumentVersionRow): DocumentVersion {
  return {
    ...row,
    is_ai_generated: Boolean(row.is_ai_generated),
  };
}

// Get all documents
export function getAll(applicationId?: number): Document[] {
  let sql = 'SELECT * FROM documents';
  const values: number[] = [];

  if (applicationId !== undefined) {
    sql += ' WHERE application_id = ?';
    values.push(applicationId);
  }
  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...values) as DocumentRow[];
  return rows.map(parseDocument);
}

// Get single document by ID
export function getById(id: number): Document | null {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow | undefined;
  return row ? parseDocument(row) : null;
}

// Get document with all versions
export function getWithVersions(id: number): (Document & { versions: DocumentVersion[] }) | null {
  const doc = getById(id);
  if (!doc) return null;

  const versions = getVersions(id);
  return { ...doc, versions };
}

// Create document
export function create(data: CreateDocumentData): Document {
  if (!data.type || !VALID_TYPES.includes(data.type)) {
    validationError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const stmt = db.prepare(`
    INSERT INTO documents (application_id, type, question, key_points)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.application_id || null,
    data.type,
    data.question || null,
    data.key_points ? JSON.stringify(data.key_points) : null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update document
export function update(id: number, data: UpdateDocumentData): Document {
  const existing = getById(id);
  if (!existing) {
    notFound('Document');
  }

  if (data.type && !VALID_TYPES.includes(data.type)) {
    validationError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.application_id !== undefined) {
    fields.push('application_id = ?');
    values.push(data.application_id);
  }
  if (data.type !== undefined) {
    fields.push('type = ?');
    values.push(data.type);
  }
  if (data.question !== undefined) {
    fields.push('question = ?');
    values.push(data.question);
  }
  if (data.key_points !== undefined) {
    fields.push('key_points = ?');
    values.push(data.key_points ? JSON.stringify(data.key_points) : null);
  }

  if (fields.length > 0) {
    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete document
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Document');
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  return true;
}

// Get all versions for a document
export function getVersions(documentId: number): DocumentVersion[] {
  const rows = db.prepare(
    'SELECT * FROM document_versions WHERE document_id = ? ORDER BY version DESC'
  ).all(documentId) as DocumentVersionRow[];
  return rows.map(parseVersion);
}

// Add new version
export function addVersion(documentId: number, data: CreateVersionData): DocumentVersion {
  const doc = getById(documentId);
  if (!doc) {
    notFound('Document');
  }

  if (!data.content) {
    validationError('Content is required');
  }

  // Get the latest version number
  const latestVersion = db.prepare(
    'SELECT MAX(version) as max_version FROM document_versions WHERE document_id = ?'
  ).get(documentId) as { max_version: number | null };

  const newVersion = (latestVersion?.max_version || 0) + 1;

  const stmt = db.prepare(`
    INSERT INTO document_versions (document_id, version, content, prompt_used, is_ai_generated)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    documentId,
    newVersion,
    data.content,
    data.prompt_used || null,
    data.is_ai_generated ? 1 : 0
  );

  const row = db.prepare('SELECT * FROM document_versions WHERE id = ?').get(
    result.lastInsertRowid
  ) as DocumentVersionRow;

  return parseVersion(row);
}
