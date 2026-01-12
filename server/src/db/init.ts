import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { closeDatabase } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run migrations to add new columns to existing tables
function runMigrations(): void {
  console.log('Running migrations...');

  // Check if email columns exist on applications table
  const tableInfo = db.prepare("PRAGMA table_info(applications)").all() as { name: string }[];
  const columnNames = tableInfo.map(col => col.name);

  // Add email_id column if it doesn't exist
  if (!columnNames.includes('email_id')) {
    db.exec('ALTER TABLE applications ADD COLUMN email_id TEXT');
    console.log('Added email_id column to applications table.');
  }

  // Add email_subject column if it doesn't exist
  if (!columnNames.includes('email_subject')) {
    db.exec('ALTER TABLE applications ADD COLUMN email_subject TEXT');
    console.log('Added email_subject column to applications table.');
  }

  // Add email_date column if it doesn't exist
  if (!columnNames.includes('email_date')) {
    db.exec('ALTER TABLE applications ADD COLUMN email_date TEXT');
    console.log('Added email_date column to applications table.');
  }

  console.log('Migrations complete.');
}

async function initializeDatabase(): Promise<void> {
  console.log('Initializing database...');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    db.exec(schema);

    console.log('Database schema created successfully.');

    // Run migrations for existing databases
    runMigrations();

    // Insert default profile row if not exists
    const profile = db.prepare('SELECT id FROM profile WHERE id = 1').get();
    if (!profile) {
      db.prepare('INSERT INTO profile (id) VALUES (1)').run();
      console.log('Default profile created.');
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

initializeDatabase();
