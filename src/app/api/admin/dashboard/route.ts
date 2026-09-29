import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getPlatformOverview, getRecentCbtAssessments, getRecentAttemptActivity, getRecentActiveStudents } from '@/lib/admin/dashboardStats';

export const runtime = 'nodejs';

/** Real platform aggregates for the admin dashboard — no mock data, every field is a live Postgres query. */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const [overview, recentAssessments, recentActivity, recentStudents] = await Promise.all([
    getPlatformOverview(),
    getRecentCbtAssessments(5),
    getRecentAttemptActivity(6),
    getRecentActiveStudents(5),
  ]);

  return NextResponse.json({ success: true, overview, recentAssessments, recentActivity, recentStudents });
}
