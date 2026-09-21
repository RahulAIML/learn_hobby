import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { getUserById } from './store';
import type { User } from './types';

export const SESSION_COOKIE = 'gurukul_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  sub: string; // userId
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured.');
  }
  return secret;
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = { sub: userId };
  return jwt.sign(payload, getSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as SessionPayload;
    return decoded.sub ?? null;
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
export function getSessionUser(req: NextRequest): User | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verifySessionToken(token);
  if (!userId) return null;

  return getUserById(userId) ?? null;
}

/** Same as getSessionUser, but for Server Components/pages using next/headers' cookies() instead of a NextRequest. */
export function getSessionUserFromCookieValue(cookieValue: string | undefined): User | null {
  if (!cookieValue) return null;
  const userId = verifySessionToken(cookieValue);
  if (!userId) return null;
  return getUserById(userId) ?? null;
}
