import db from '../db/index.js';
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
}

// Get the single profile (id = 1)
export function getProfile(): Profile | null {
  const stmt = db.prepare('SELECT * FROM profile WHERE id = 1');
  const row = stmt.get() as Profile | undefined;
  return row || null;
}

// Update profile fields
export function updateProfile(data: UpdateProfileData): Profile {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  // Build dynamic update query based on provided fields
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?');
    values.push(data.phone);
  }
  if (data.location !== undefined) {
    fields.push('location = ?');
    values.push(data.location);
  }
  if (data.linkedin_url !== undefined) {
    fields.push('linkedin_url = ?');
    values.push(data.linkedin_url);
  }
  if (data.github_url !== undefined) {
    fields.push('github_url = ?');
    values.push(data.github_url);
  }
  if (data.portfolio_url !== undefined) {
    fields.push('portfolio_url = ?');
    values.push(data.portfolio_url);
  }
  if (data.career_goals !== undefined) {
    fields.push('career_goals = ?');
    values.push(data.career_goals);
  }
  if (data.preferences !== undefined) {
    fields.push('preferences = ?');
    values.push(data.preferences);
  }
  if (data.deal_breakers !== undefined) {
    fields.push('deal_breakers = ?');
    values.push(data.deal_breakers);
  }
  if (data.additional_context !== undefined) {
    fields.push('additional_context = ?');
    values.push(data.additional_context);
  }

  if (fields.length > 0) {
    const sql = `UPDATE profile SET ${fields.join(', ')} WHERE id = 1`;
    db.prepare(sql).run(...values);
  }

  return getProfile()!;
}
