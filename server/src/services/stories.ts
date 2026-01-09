import db from '../db/index.js';
import { Story } from '../types/index.js';
import { validationError, notFound } from '../middleware/response.js';

interface StoryRow {
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

export interface CreateStoryData {
  title: string;
  situation?: string | null;
  task?: string | null;
  action?: string | null;
  result?: string | null;
  tags?: string[];
}

export interface UpdateStoryData {
  title?: string;
  situation?: string | null;
  task?: string | null;
  action?: string | null;
  result?: string | null;
  tags?: string[];
}

function parseStory(row: StoryRow): Story {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : null,
  };
}

// Get all stories
export function getAll(): Story[] {
  const rows = db.prepare(
    'SELECT * FROM stories ORDER BY created_at DESC'
  ).all() as StoryRow[];
  return rows.map(parseStory);
}

// Get single story by ID
export function getById(id: number): Story | null {
  const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(id) as StoryRow | undefined;
  return row ? parseStory(row) : null;
}

// Get stories by tag
export function getByTag(tag: string): Story[] {
  // Search for tag in JSON array
  const rows = db.prepare(
    `SELECT * FROM stories WHERE tags LIKE ? ORDER BY created_at DESC`
  ).all(`%"${tag}"%`) as StoryRow[];
  return rows.map(parseStory);
}

// Create story
export function create(data: CreateStoryData): Story {
  if (!data.title) {
    validationError('Title is required');
  }

  const stmt = db.prepare(`
    INSERT INTO stories (title, situation, task, action, result, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.situation || null,
    data.task || null,
    data.action || null,
    data.result || null,
    data.tags ? JSON.stringify(data.tags) : null
  );

  return getById(result.lastInsertRowid as number)!;
}

// Update story
export function update(id: number, data: UpdateStoryData): Story {
  const existing = getById(id);
  if (!existing) {
    notFound('Story');
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.situation !== undefined) {
    fields.push('situation = ?');
    values.push(data.situation);
  }
  if (data.task !== undefined) {
    fields.push('task = ?');
    values.push(data.task);
  }
  if (data.action !== undefined) {
    fields.push('action = ?');
    values.push(data.action);
  }
  if (data.result !== undefined) {
    fields.push('result = ?');
    values.push(data.result);
  }
  if (data.tags !== undefined) {
    fields.push('tags = ?');
    values.push(data.tags ? JSON.stringify(data.tags) : null);
  }

  if (fields.length > 0) {
    const sql = `UPDATE stories SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values, id);
  }

  return getById(id)!;
}

// Delete story
export function remove(id: number): boolean {
  const existing = getById(id);
  if (!existing) {
    notFound('Story');
  }

  db.prepare('DELETE FROM stories WHERE id = ?').run(id);
  return true;
}
