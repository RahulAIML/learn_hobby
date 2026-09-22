import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { users, enrollments } from '@/lib/db/schema';
import { isUuid } from '@/lib/db/isUuid';
import { hashPassword } from './password';
import type { User, UserRole } from './types';

/**
 * Postgres-backed (Drizzle) user + enrollment store. Real persistence —
 * Render Postgres in production, real Postgres via Docker locally, and a
 * real (WASM) Postgres engine in tests. See src/lib/db/client.ts.
 */

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    mobile: row.mobile,
    phoneNo: row.phoneNo,
    role: row.role as UserRole,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (!isUuid(id)) return undefined;
  const db = await getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? rowToUser(row) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ? rowToUser(row) : undefined;
}

export type CreateUserError = 'invalid_email' | 'invalid_password' | 'invalid_username' | 'invalid_name' | 'invalid_mobile' | 'username_taken' | 'email_taken';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164-ish: optional leading +, 7-15 digits. Deliberately permissive on
// separators being stripped rather than rejecting common human formatting.
const PHONE_RE = /^\+?[0-9]{7,15}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '');
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  name: string;
  mobile?: string;
  phoneNo?: string;
  role?: UserRole;
}

export async function createUser(input: CreateUserInput): Promise<{ user: User } | { error: CreateUserError }> {
  const username = input.username.trim();
  if (!USERNAME_RE.test(username)) return { error: 'invalid_username' };

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: 'invalid_email' };

  if (!input.password || input.password.length < 6) return { error: 'invalid_password' };

  const name = input.name.trim();
  if (!name || name.length > 200) return { error: 'invalid_name' };

  let mobile: string | null = null;
  if (input.mobile) {
    mobile = normalizePhone(input.mobile);
    if (!PHONE_RE.test(mobile)) return { error: 'invalid_mobile' };
  }

  let phoneNo: string | null = null;
  if (input.phoneNo) {
    phoneNo = normalizePhone(input.phoneNo);
    if (!PHONE_RE.test(phoneNo)) return { error: 'invalid_mobile' };
  }

  const db = await getDb();

  if (await getUserByEmail(email)) return { error: 'email_taken' };
  const [existingUsername] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existingUsername) return { error: 'username_taken' };

  const id = randomUUID();
  const now = new Date();

  try {
    await db.insert(users).values({
      id,
      username,
      email,
      name,
      mobile,
      phoneNo,
      passwordHash: hashPassword(input.password),
      role: input.role ?? 'student',
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    // Race-condition fallback: a concurrent insert could win between our
    // pre-checks and this insert — the unique constraint is the real
    // source of truth, this just turns the raw DB error into a clean one.
    const message = err instanceof Error ? err.message : '';
    if (message.includes('users_email_unique')) return { error: 'email_taken' };
    if (message.includes('users_username_unique')) return { error: 'username_taken' };
    throw err;
  }

  const user = await getUserById(id);
  if (!user) throw new Error('Failed to read back created user.');
  return { user };
}

export type UpdateUserError = 'invalid_name' | 'invalid_mobile' | 'user_not_found';

export interface UpdateUserInput {
  name?: string;
  mobile?: string | null;
  phoneNo?: string | null;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<{ user: User } | { error: UpdateUserError }> {
  const db = await getDb();

  const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name || name.length > 200) return { error: 'invalid_name' };
    patch.name = name;
  }

  if (input.mobile !== undefined) {
    if (input.mobile === null) {
      patch.mobile = null;
    } else {
      const mobile = normalizePhone(input.mobile);
      if (!PHONE_RE.test(mobile)) return { error: 'invalid_mobile' };
      patch.mobile = mobile;
    }
  }

  if (input.phoneNo !== undefined) {
    if (input.phoneNo === null) {
      patch.phoneNo = null;
    } else {
      const phoneNo = normalizePhone(input.phoneNo);
      if (!PHONE_RE.test(phoneNo)) return { error: 'invalid_mobile' };
      patch.phoneNo = phoneNo;
    }
  }

  const [row] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  if (!row) return { error: 'user_not_found' };

  return { user: rowToUser(row) };
}

export async function isEnrolled(userId: string, courseSlug: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseSlug, courseSlug)))
    .limit(1);
  return !!row;
}

/** All course slugs a user is enrolled in — embedded into the session JWT at login time. */
export async function listEnrollments(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  return rows.map((r) => r.courseSlug);
}

export async function enrollUser(userId: string, courseSlug: string): Promise<void> {
  const db = await getDb();
  await db.insert(enrollments).values({ userId, courseSlug }).onConflictDoNothing();
}
