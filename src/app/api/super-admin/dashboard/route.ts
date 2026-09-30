import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/adminGuard';
import {
  getSuperAdminOverview,
  getStudentGrowthSeries,
  getAssessmentAttemptsSeries,
  getCourseEngagement,
  getCbtPerformanceTrend,
  getSystemStatus,
  getRecentActivity,
} from '@/lib/superAdmin/realData';

export const runtime = 'nodejs';

/** Real platform aggregates for the Super Admin dashboard — no mock data, every field is a live Postgres query. */
export async function GET(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if ('response' in auth) return auth.response;

  const [overview, studentGrowth, assessmentAttempts, courseEngagement, cbtTrend, systemStatus, recentActivity] = await Promise.all([
    getSuperAdminOverview(),
    getStudentGrowthSeries(),
    getAssessmentAttemptsSeries(),
    getCourseEngagement(),
    getCbtPerformanceTrend(),
    getSystemStatus(),
    getRecentActivity(6),
  ]);

  return NextResponse.json({
    success: true,
    data: { overview, studentGrowth, assessmentAttempts, courseEngagement, cbtTrend, systemStatus, recentActivity },
  });
}
