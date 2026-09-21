export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * The user info embedded directly in the signed session JWT (see
 * src/lib/auth/session.ts) — deliberately self-contained (no DB lookup
 * needed to resolve a session) so authorization is consistent no matter
 * which serverless instance handles a given request. On Vercel, each
 * instance has its own ephemeral /tmp SQLite file (see src/lib/db/sqlite.ts),
 * so a DB-lookup-based session would resolve differently per instance.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  enrollments: string[];
}
