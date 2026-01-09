import db from '../db/index.js';
import { Project } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  technologies: string | null;
  outcomes: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
  technologies?: string[];
  outcomes?: string | null;
  url?: string | null;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  technologies?: string[];
  outcomes?: string | null;
  url?: string | null;
}

function parseProject(row: ProjectRow): Project {
  return {
    ...row,
    technologies: row.technologies ? JSON.parse(row.technologies) : null,
  };
}

// Get all projects
export function getAll(): Project[] {
  const rows = db.prepare(
    'SELECT * FROM projects ORDER BY created_at DESC'
  ).all() as ProjectRow[];
  return rows.map(parseProject);
}

// Get single project by ID
export function getById(id: number): Project | null {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  return row ? parseProject(row) : null;
}

// Create project
export function create(data: CreateProjectData): Project {
  if (!data.name) {
    validationError('Name is required');
  }

  const stmt = db.prepare(`
    INSERT INTO projects (name, description, technologies, outcomes, url)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.name,
    data.description || null,
    data.technologies ? JSON.stringify(data.technologies) : null,
    data.outcomes || null,
    data.url || null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update project
export function update(id: number, data: UpdateProjectData): Project {
  const existing = getById(id);
  if (!existing) {
    notFound('Project');
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.technologies !== undefined) {
    fields.push('technologies = ?');
    values.push(data.technologies ? JSON.stringify(data.technologies) : null);
  }
  if (data.outcomes !== undefined) {
    fields.push('outcomes = ?');
    values.push(data.outcomes);
  }
  if (data.url !== undefined) {
    fields.push('url = ?');
    values.push(data.url);
  }

  if (fields.length > 0) {
    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete project
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Project');
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return true;
}
