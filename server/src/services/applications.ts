import db from '../db/index.js';
import { Application, ApplicationStatusOption, Contact } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface ApplicationRow {
  id: number;
  company: string;
  role: string;
  url: string | null;
  job_description: string | null;
  status: string;
  date_saved: string;
  date_applied: string | null;
  contacts: string | null;
  notes: string | null;
  custom_statuses: string | null;
  created_at: string;
  updated_at: string;
}

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

function parseApplication(row: ApplicationRow): Application {
  return {
    ...row,
    contacts: row.contacts ? JSON.parse(row.contacts) : null,
    custom_statuses: row.custom_statuses ? JSON.parse(row.custom_statuses) : null,
  };
}

// Get all applications with optional filters
export function getAll(filters?: ApplicationFilters): Application[] {
  let sql = 'SELECT * FROM applications';
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters?.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }
  if (filters?.company) {
    conditions.push('company LIKE ?');
    values.push(`%${filters.company}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY date_saved DESC';

  const rows = db.prepare(sql).all(...values) as ApplicationRow[];
  return rows.map(parseApplication);
}

// Get single application by ID
export function getById(id: number): Application | null {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as ApplicationRow | undefined;
  return row ? parseApplication(row) : null;
}

// Create new application
export function create(data: CreateApplicationData): Application {
  if (!data.company || !data.role) {
    validationError('Company and role are required');
  }

  const stmt = db.prepare(`
    INSERT INTO applications (company, role, url, job_description, status, date_applied, contacts, notes, custom_statuses)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.company,
    data.role,
    data.url || null,
    data.job_description || null,
    data.status || 'saved',
    data.date_applied || null,
    data.contacts ? JSON.stringify(data.contacts) : null,
    data.notes || null,
    data.custom_statuses ? JSON.stringify(data.custom_statuses) : null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update application
export function update(id: number, data: UpdateApplicationData): Application {
  const existing = getById(id);
  if (!existing) {
    notFound('Application');
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.company !== undefined) {
    fields.push('company = ?');
    values.push(data.company);
  }
  if (data.role !== undefined) {
    fields.push('role = ?');
    values.push(data.role);
  }
  if (data.url !== undefined) {
    fields.push('url = ?');
    values.push(data.url);
  }
  if (data.job_description !== undefined) {
    fields.push('job_description = ?');
    values.push(data.job_description);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }
  if (data.date_applied !== undefined) {
    fields.push('date_applied = ?');
    values.push(data.date_applied);
  }
  if (data.contacts !== undefined) {
    fields.push('contacts = ?');
    values.push(data.contacts ? JSON.stringify(data.contacts) : null);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }
  if (data.custom_statuses !== undefined) {
    fields.push('custom_statuses = ?');
    values.push(data.custom_statuses ? JSON.stringify(data.custom_statuses) : null);
  }

  if (fields.length > 0) {
    const sql = `UPDATE applications SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete application
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Application');
  }

  db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  return true;
}

// Update status only
export function updateStatus(id: number, status: string): Application {
  const existing = getById(id);
  if (!existing) {
    notFound('Application');
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, id);
  return getById(id)!;
}
