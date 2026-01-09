import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get database path from environment or use default
const dbPath = process.env.DATABASE_PATH || './data/app.db';
const absoluteDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(__dirname, '../../', dbPath);

// Ensure data directory exists
const dbDir = path.dirname(absoluteDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db: DatabaseType = new Database(absoluteDbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

export default db;

export function closeDatabase(): void {
  db.close();
}
