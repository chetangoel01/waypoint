import db from '../db/index.js';
import { Skill } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface SkillRow {
  id: number;
  category: string;
  name: string;
  proficiency: string | null;
  created_at: string;
}

export interface CreateSkillData {
  category: string;
  name: string;
  proficiency?: string | null;
}

export interface UpdateSkillData {
  category?: string;
  name?: string;
  proficiency?: string | null;
}

export interface SkillsByCategory {
  [category: string]: Skill[];
}

// Get all skills
export function getAll(): Skill[] {
  const rows = db.prepare(
    'SELECT * FROM skills ORDER BY category, name'
  ).all() as SkillRow[];
  return rows;
}

// Get all skills grouped by category
export function getAllGrouped(): SkillsByCategory {
  const skills = getAll();
  return skills.reduce((acc: SkillsByCategory, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});
}

// Get single skill by ID
export function getById(id: number): Skill | null {
  const row = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRow | undefined;
  return row || null;
}

// Get skills by category
export function getByCategory(category: string): Skill[] {
  const rows = db.prepare(
    'SELECT * FROM skills WHERE category = ? ORDER BY name'
  ).all(category) as SkillRow[];
  return rows;
}

// Create skill
export function create(data: CreateSkillData): Skill {
  if (!data.category || !data.name) {
    validationError('Category and name are required');
  }

  const stmt = db.prepare(`
    INSERT INTO skills (category, name, proficiency)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    data.category,
    data.name,
    data.proficiency || null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update skill
export function update(id: number, data: UpdateSkillData): Skill {
  const existing = getById(id);
  if (!existing) {
    notFound('Skill');
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.category !== undefined) {
    fields.push('category = ?');
    values.push(data.category);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.proficiency !== undefined) {
    fields.push('proficiency = ?');
    values.push(data.proficiency);
  }

  if (fields.length > 0) {
    const sql = `UPDATE skills SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete skill
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Skill');
  }

  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
  return true;
}

// Delete all skills in a category
export function removeByCategory(category: string): number {
  const result = db.prepare('DELETE FROM skills WHERE category = ?').run(category);
  return result.changes;
}
