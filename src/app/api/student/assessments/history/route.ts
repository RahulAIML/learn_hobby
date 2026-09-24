import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { listAttemptsByStudent } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Every past attempt for the authenticated student — every row is a distinct attempt, never overwritten by a later one. */
export async function GET(req: NextRequest) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: { code: 'unauthenticated', message: 'Please sign in.' } }, { status: 401 });
  }
  const rows = await listAttemptsByStudent(sessionUser.id);
  const history = rows.map(({ attempt, assessment }) => ({
    attemptId: attempt.id,
    assessmentId: assessment.id,
    title: assessment.title,
    topic: assessment.topic,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    timeTakenSeconds: attempt.timeTakenSeconds,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
  }));
  return NextResponse.json({ success: true, history });
}
