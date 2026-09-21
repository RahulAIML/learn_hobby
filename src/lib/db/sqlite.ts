import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * SQLite persistence for auth data (users, enrollments).
 *
 * LIMITATION: Vercel's serverless filesystem is read-only except for
 * /tmp, and /tmp is wiped between cold starts / across instances — so
 * on Vercel this file is NOT durable storage, the same limitation as
 * every in-memory store elsewhere in this project. Locally (npm run dev)
 * it persists to a real file on disk across restarts. This is a
 * structural step toward a real database (e.g. swapping DB_PATH for a
 * managed Postgres/Turso connection) without changing any caller.
 */

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  // Isolated per-process in-memory DB under the test runner — avoids file
  // locking when multiple test files/workers touch the store concurrently.
  if (process.env.VITEST) return ':memory:';
  const dir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.data');
  if (!process.env.VERCEL && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'gurukul.db');
}

declare global {
  // eslint-disable-next-line no-var
  var __gurukulDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      enrolled_at TEXT NOT NULL,
      PRIMARY KEY (user_id, course_slug)
    );
  `);

  return db;
}

/** Reused across hot-reloads/module re-imports in the same process (dev) via a global singleton. */
export function getDb(): Database.Database {
  if (!global.__gurukulDb) {
    global.__gurukulDb = createConnection();
  }
  return global.__gurukulDb;
}
