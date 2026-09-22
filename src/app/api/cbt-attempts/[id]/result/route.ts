import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAttempt, getAttemptResult } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/**
 * Post-submission result + review. Correct answers/explanations are only
 * ever included here — never from the in-progress attempt endpoints — and
 * only for the attempt's own student, and only once it is no longer
 * in_progress (submitted or expired).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });
  }

  const attempt = await getAttempt(params.id);
  if (!attempt || attempt.studentId !== user.id) {
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
