import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getUserById } from '@/lib/auth/store';
import { toPublicUser } from '@/lib/auth/types';
import { getStudentPerformanceSummary, listAttemptsByStudent } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Full admin view of one student: profile + performance summary + every attempt (not just the latest). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const user = await getUserById(params.id);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  const performance = await getStudentPerformanceSummary(user.id);
  const attemptRows = await listAttemptsByStudent(user.id);
  const attempts = attemptRows.map(({ attempt, assessment }) => ({
    attemptId: attempt.id,
    assessmentId: assessment.id,
    title: assessment.title,
    topic: assessment.topic,
    status: attempt.status,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
  }));

  return NextResponse.json({
    success: true,
    profile: toPublicUser(user),
    performance: {
      totalAttempts: performance.totalAttempts,
      completedAttempts: performance.completedAttempts,
      averagePercentage: performance.averagePercentage,
      bestPercentage: performance.bestPercentage,
      topicPerformance: performance.topicPerformance,
    },
    attempts,
  });
}
