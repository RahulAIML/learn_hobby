import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import type { PublicUser, SessionUser } from './types';

export const SESSION_COOKIE = 'gurukul_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  sub: string; // userId
  email: string;
  name: string;
  role: SessionUser['role'];
  enrollments: string[];
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured.');
  }
  return secret;
}

/**
 * The session is self-contained: role and enrollments are embedded in the
 * signed JWT at login time, not re-resolved from the DB on every request.
 * This matters because on Vercel each serverless instance has its own
 * ephemeral /tmp SQLite file (src/lib/db/sqlite.ts) — a DB lookup here
 * would resolve inconsistently depending on which instance handles the
 * request. The JWT signature is the source of truth instead.
 */
export function createSessionToken(user: PublicUser, enrollments: string[]): string {
  const payload: SessionPayload = { sub: user.id, email: user.email, name: user.name, role: user.role, enrollments };
  return jwt.sign(payload, getSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

function decodeSessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as SessionPayload;
    if (!decoded.sub) return null;
    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      enrollments: decoded.enrollments ?? [],
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Resolves the authenticated user from the request's session cookie (a signed JWT), or null. */
export function getSessionUser(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSessionToken(token);
}

/** Same as getSessionUser, but for Server Components/pages using next/headers' cookies() instead of a NextRequest. */
export function getSessionUserFromCookieValue(cookieValue: string | undefined): SessionUser | null {
  if (!cookieValue) return null;
  return decodeSessionToken(cookieValue);
}
