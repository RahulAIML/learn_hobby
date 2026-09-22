import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { resolveSslOption } from './connectionOptions';

/**
 * Postgres connection (Render Postgres in prod/dev, DATABASE_URL-driven).
 *
 * Under Vitest, no real Postgres server is available in this environment
 * (no Docker), so tests run against @electric-sql/pglite instead — a real
 * Postgres engine compiled to WASM, not a mock. Same schema, same SQL
 * dialect, same Drizzle query API; only the connection differs. Production
 * and local dev (via `docker compose up db`, see docker-compose.yml) both
 * use real Postgres through DATABASE_URL.
 */

type DrizzleDb = ReturnType<typeof drizzlePostgres<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __gurukulDb: DrizzleDb | undefined;
}

function createProductionConnection(): DrizzleDb {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  const client = postgres(connectionString, { max: 10, ssl: resolveSslOption(connectionString) });
  return drizzlePostgres(client, { schema });
}

let testDbPromise: Promise<DrizzleDb> | null = null;

async function createTestConnection(): Promise<DrizzleDb> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite');
  const client = new PGlite();
  const db = drizzlePglite(client, { schema }) as unknown as DrizzleDb;

  // Tests have no migration runner — apply the schema directly once.
  // PGlite's protocol (unlike postgres.js) rejects multiple statements in
  // a single prepared query, so each CREATE TABLE is a separate execute().
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      username varchar(32) NOT NULL UNIQUE,
      email varchar(255) NOT NULL UNIQUE,
      name varchar(200) NOT NULL,
      mobile varchar(20),
      phone_no varchar(20),
      password_hash varchar(255) NOT NULL,
      role varchar(20) NOT NULL DEFAULT 'student',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_slug varchar(100) NOT NULL,
      enrolled_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, course_slug)
    )
  `);

  return db;
}

/** Async because the test path (PGlite) initializes asynchronously; the production path resolves immediately. */
export async function getDb(): Promise<DrizzleDb> {
  if (global.__gurukulDb) return global.__gurukulDb;

  if (process.env.VITEST) {
    if (!testDbPromise) testDbPromise = createTestConnection();
    global.__gurukulDb = await testDbPromise;
    return global.__gurukulDb;
  }

  global.__gurukulDb = createProductionConnection();
  return global.__gurukulDb;
}
