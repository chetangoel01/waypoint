import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { closeDatabase } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase(): Promise<void> {
  console.log('Initializing database...');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    db.exec(schema);

    console.log('Database schema created successfully.');

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
