import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/adminGuard';
import { listAssessmentsOverview, getAssessmentStats } from '@/lib/superAdmin/realData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if ('response' in auth) return auth.response;

  const [assessments, stats] = await Promise.all([listAssessmentsOverview(), getAssessmentStats()]);
  return NextResponse.json({ success: true, data: { assessments, stats } });
}
