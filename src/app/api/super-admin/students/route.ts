import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/adminGuard';
import { listStudentsOverview, getStudentStats } from '@/lib/superAdmin/realData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if ('response' in auth) return auth.response;

  const [students, stats] = await Promise.all([listStudentsOverview(), getStudentStats()]);
  return NextResponse.json({ success: true, data: { students, stats } });
}
