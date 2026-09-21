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
