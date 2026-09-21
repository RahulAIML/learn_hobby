import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db/sqlite';
import { hashPassword } from './password';
import type { User, UserRole } from './types';

/**
 * SQLite-backed user + enrollment store. See src/lib/db/sqlite.ts for
 * the durability caveat (real persistence locally, ephemeral /tmp on
 * Vercel until a managed database is wired in).
 */

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function seed() {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('student@gurukul.dev') as { id: string } | undefined;
  if (existing) return;

  const studentId = randomUUID();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(studentId, 'student@gurukul.dev', hashPassword('student123'), 'Demo Student', 'student', new Date().toISOString());

  db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_slug, enrolled_at) VALUES (?, ?, ?)').run(
    studentId,
    'data-science',
    new Date().toISOString()
  );
}
seed();

export function getUserById(id: string): User | undefined {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

export type CreateUserError = 'invalid_email' | 'invalid_password' | 'email_taken';

export function createUser(input: { email: string; password: string; name: string; role?: UserRole }): { user: User } | { error: CreateUserError } {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) return { error: 'invalid_email' };
  if (!input.password || input.password.length < 6) return { error: 'invalid_password' };
  if (getUserByEmail(email)) return { error: 'email_taken' };

  const id = randomUUID();
  const user: User = {
    id,
    email,
    passwordHash: hashPassword(input.password),
    name: input.name.trim() || email,
    role: input.role ?? 'student',
    createdAt: new Date().toISOString(),
  };

  getDb()
    .prepare('INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user.id, user.email, user.passwordHash, user.name, user.role, user.createdAt);

  return { user };
}

export function isEnrolled(userId: string, courseSlug: string): boolean {
  const row = getDb()
    .prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_slug = ?')
    .get(userId, courseSlug);
  return !!row;
}

export function enrollUser(userId: string, courseSlug: string): void {
  getDb()
    .prepare('INSERT OR IGNORE INTO enrollments (user_id, course_slug, enrolled_at) VALUES (?, ?, ?)')
    .run(userId, courseSlug, new Date().toISOString());
}
