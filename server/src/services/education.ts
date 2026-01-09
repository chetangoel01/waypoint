import db from '../db/index.js';
import { Education } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface EducationRow {
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

export interface CreateEducationData {
  institution: string;
  degree: string;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  gpa?: number | null;
  coursework?: string[];
}

export interface UpdateEducationData {
  institution?: string;
  degree?: string;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  gpa?: number | null;
  coursework?: string[];
}

function parseEducation(row: EducationRow): Education {
  return {
    ...row,
    coursework: row.coursework ? JSON.parse(row.coursework) : null,
  };
}

// Get all education entries
export function getAll(): Education[] {
  const rows = db.prepare(
    'SELECT * FROM education ORDER BY start_date DESC'
  ).all() as EducationRow[];
  return rows.map(parseEducation);
}

// Get single education by ID
export function getById(id: number): Education | null {
  const row = db.prepare('SELECT * FROM education WHERE id = ?').get(id) as EducationRow | undefined;
  return row ? parseEducation(row) : null;
}

// Create education
export function create(data: CreateEducationData): Education {
  if (!data.institution || !data.degree) {
    validationError('Institution and degree are required');
  }

  const stmt = db.prepare(`
    INSERT INTO education (institution, degree, field, start_date, end_date, gpa, coursework)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.institution,
    data.degree,
    data.field || null,
    data.start_date || null,
    data.end_date || null,
    data.gpa || null,
    data.coursework ? JSON.stringify(data.coursework) : null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update education
export function update(id: number, data: UpdateEducationData): Education {
  const existing = getById(id);
  if (!existing) {
    notFound('Education');
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.institution !== undefined) {
    fields.push('institution = ?');
    values.push(data.institution);
  }
  if (data.degree !== undefined) {
    fields.push('degree = ?');
    values.push(data.degree);
  }
  if (data.field !== undefined) {
    fields.push('field = ?');
    values.push(data.field);
  }
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(data.end_date);
  }
  if (data.gpa !== undefined) {
    fields.push('gpa = ?');
    values.push(data.gpa);
  }
  if (data.coursework !== undefined) {
    fields.push('coursework = ?');
    values.push(data.coursework ? JSON.stringify(data.coursework) : null);
  }

  if (fields.length > 0) {
    const sql = `UPDATE education SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete education
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Education');
  }

  db.prepare('DELETE FROM education WHERE id = ?').run(id);
  return true;
}
