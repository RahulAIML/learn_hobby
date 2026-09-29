import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getCbtAssessment, updateCbtAssessment } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Admin: republish an archived assessment, making it visible to students again. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const assessment = await getCbtAssessment(params.id);
  if (!assessment) return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Assessment not found.' } }, { status: 404 });
  if (assessment.status !== 'archived') {
    return NextResponse.json({ success: false, error: { code: 'invalid_status', message: 'Only an archived assessment can be unarchived.' } }, { status: 400 });
  }

  const updated = await updateCbtAssessment(params.id, { status: 'published' });
  return NextResponse.json({ success: true, assessment: updated });
}
