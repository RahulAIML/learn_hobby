export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  mobile: string | null;
  phoneNo: string | null;
  role: UserRole;
  lastLoginAt: string | null;
  age: number | null;
  goalCategory: string | null;
  goalSubcategory: string | null;
  goalOption: string | null;
  profileCompletedAt: string | null;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  name: string;
  mobile: string | null;
  phoneNo: string | null;
  role: UserRole;
  age: number | null;
  goalCategory: string | null;
  goalSubcategory: string | null;
  goalOption: string | null;
  profileCompletedAt: string | null;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    phoneNo: user.phoneNo,
    role: user.role,
    age: user.age,
    goalCategory: user.goalCategory,
    goalSubcategory: user.goalSubcategory,
    goalOption: user.goalOption,
    profileCompletedAt: user.profileCompletedAt,
  };
}

/**
 * The user info embedded directly in the signed session JWT (see
 * src/lib/auth/session.ts) — deliberately self-contained (no DB lookup
 * needed to resolve a session) so authorization is consistent no matter
 * which serverless instance handles a given request. On Vercel, each
 * instance has its own ephemeral /tmp filesystem, so a DB-lookup-based
 * session could otherwise resolve inconsistently under load.
 */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  enrollments: string[];
}
