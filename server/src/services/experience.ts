import db from '../db/index.js';
import { WorkExperience } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface ExperienceRow {
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

export interface CreateExperienceData {
  company: string;
  role: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  achievements?: string[];
}

export interface UpdateExperienceData {
  company?: string;
  role?: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  achievements?: string[];
}

function parseExperience(row: ExperienceRow): WorkExperience {
  return {
    ...row,
    achievements: row.achievements ? JSON.parse(row.achievements) : null,
  };
}

// Get all work experiences
export function getAll(): WorkExperience[] {
  const rows = db.prepare(
    'SELECT * FROM work_experience ORDER BY start_date DESC'
  ).all() as ExperienceRow[];
  return rows.map(parseExperience);
}

// Get single experience by ID
export function getById(id: number): WorkExperience | null {
  const row = db.prepare('SELECT * FROM work_experience WHERE id = ?').get(id) as ExperienceRow | undefined;
  return row ? parseExperience(row) : null;
}

// Create experience
export function create(data: CreateExperienceData): WorkExperience {
  if (!data.company || !data.role) {
    validationError('Company and role are required');
  }

  const stmt = db.prepare(`
    INSERT INTO work_experience (company, role, start_date, end_date, description, achievements)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.company,
    data.role,
    data.start_date || null,
    data.end_date || null,
    data.description || null,
    data.achievements ? JSON.stringify(data.achievements) : null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update experience
export function update(id: number, data: UpdateExperienceData): WorkExperience {
  const existing = getById(id);
  if (!existing) {
    notFound('Work experience');
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
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(data.end_date);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.achievements !== undefined) {
    fields.push('achievements = ?');
    values.push(data.achievements ? JSON.stringify(data.achievements) : null);
  }

  if (fields.length > 0) {
    const sql = `UPDATE work_experience SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete experience
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Work experience');
  }

  db.prepare('DELETE FROM work_experience WHERE id = ?').run(id);
  return true;
}
