import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAttempt, getAttemptResult } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/**
 * A single attempt's full result, scoped to exactly that attempt id — never
 * "the latest attempt". Ownership is checked against the session user, not
 * a client-supplied student id, so Student A can never read Student B's
 * attempt by guessing/enumerating ids.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });
  }

  const attempt = await getAttempt(params.id);
  if (!attempt || attempt.studentId !== sessionUser.id) {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Attempt not found.' } }, { status: 404 });
  }
  if (attempt.status === 'in_progress') {
    return NextResponse.json(
      { success: false, error: { code: 'not_submitted', message: 'This attempt has not been submitted yet.' } },
      { status: 409 }
    );
  }

  const result = await getAttemptResult(params.id);
  if (!result) {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Result not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, ...result });
}
