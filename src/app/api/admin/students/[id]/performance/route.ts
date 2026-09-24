import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getUserById } from '@/lib/auth/store';
import { getStudentPerformanceSummary } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Performance-only view (no profile/attempt list) for a specific student — admin-only. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const user = await getUserById(params.id);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Student not found.' } }, { status: 404 });
  }

  const performance = await getStudentPerformanceSummary(user.id);
  return NextResponse.json({ success: true, performance });
}
