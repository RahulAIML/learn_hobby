import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getStudentPerformanceSummary } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Aggregate performance for the authenticated student only — id from the session, never the client. */
export async function GET(req: NextRequest) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });
  }
  const summary = await getStudentPerformanceSummary(sessionUser.id);
  return NextResponse.json({ success: true, performance: summary });
}
