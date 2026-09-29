import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { getCbtAssessment, updateCbtAssessment } from '@/lib/cbt/store';

export const runtime = 'nodejs';

/** Admin: hide a published assessment from students without deleting it or its recorded attempts. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const assessment = await getCbtAssessment(params.id);
  if (!assessment) return NextResponse.json({ success: false, error: { code: 'not_found', message: 'Assessment not found.' } }, { status: 404 });
  if (assessment.status !== 'published') {
    return NextResponse.json({ success: false, error: { code: 'invalid_status', message: 'Only a published assessment can be archived.' } }, { status: 400 });
  }

  const updated = await updateCbtAssessment(params.id, { status: 'archived' });
  return NextResponse.json({ success: true, assessment: updated });
}
