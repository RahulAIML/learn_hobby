import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './session';
import type { SessionUser } from './types';

/**
 * Real admin-role enforcement for API routes that mutate course/module/
 * document/assessment data. Replaces the earlier disclosed "no auth exists
 * yet" placeholder now that real authentication (JWT sessions) and a real
 * `role` column exist.
 */
export function requireAdmin(req: NextRequest): { user: SessionUser } | { response: NextResponse } {
  const user = getSessionUser(req);
  if (!user) {
    return {
      response: NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 }),
    };
  }
  if (user.role !== 'admin') {
    return {
      response: NextResponse.json({ success: false, error: { code: 'forbidden', message: 'Admin access required.' } }, { status: 403 }),
    };
  }
  return { user };
}
