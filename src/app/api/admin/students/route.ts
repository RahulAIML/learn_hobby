import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { listUsers } from '@/lib/auth/store';
import { getStudentPerformanceSummary } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Every student with a performance summary — admin-only, list view. */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const users = await listUsers();
  const students = await Promise.all(
    users
      .filter((user) => user.role === 'student')
      .map(async (user) => {
        const performance = await getStudentPerformanceSummary(user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          age: user.age,
          goalCategory: user.goalCategory,
          goalSubcategory: user.goalSubcategory,
          goalOption: user.goalOption,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          totalAttempts: performance.totalAttempts,
          averagePercentage: performance.averagePercentage,
          bestPercentage: performance.bestPercentage,
          latestPercentage: performance.latestAttempt?.attempt.percentage ?? null,
        };
      })
  );

  return NextResponse.json({ success: true, students });
}
