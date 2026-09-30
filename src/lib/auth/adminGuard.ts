import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './session';
import type { SessionUser } from './types';

/**
 * Admin-or-higher enforcement for API routes that mutate course/module/
 * document/assessment/student data. A super_admin can do everything an
 * admin can — this is deliberately the union, not two separate checks
 * scattered across routes.
 */
export function requireAdmin(req: NextRequest): { user: SessionUser } | { response: NextResponse } {
  const user = getSessionUser(req);
  if (!user) {
    return {
      response: NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 }),
    };
  }
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return {
      response: NextResponse.json({ success: false, error: { code: 'forbidden', message: 'Admin access required.' } }, { status: 403 }),
    };
  }
  return { user };
}

/**
 * Super-admin-only enforcement for the Super Admin Control Center's API
 * routes. A regular `admin` is deliberately rejected here — super_admin is
 * a distinct, higher-privilege role, not an alias for admin.
 */
export function requireSuperAdmin(req: NextRequest): { user: SessionUser } | { response: NextResponse } {
  const user = getSessionUser(req);
  if (!user) {
    return {
      response: NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 }),
    };
  }
  if (user.role !== 'super_admin') {
    return {
      response: NextResponse.json({ success: false, error: { code: 'forbidden', message: 'Super Admin access required.' } }, { status: 403 }),
    };
  }
  return { user };
}
