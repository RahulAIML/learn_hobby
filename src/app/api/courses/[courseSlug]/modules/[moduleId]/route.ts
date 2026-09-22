import { NextRequest, NextResponse } from 'next/server';
import { getModule, deleteModule } from '@/lib/modules/store';
import { deleteAssessmentForModule } from '@/lib/assessments/store';
import { requireAdmin } from '@/lib/auth/adminGuard';

export const runtime = 'nodejs';

interface RouteParams {
  params: { courseSlug: string; moduleId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const mod = await getModule(params.courseSlug, params.moduleId);
  if (!mod) {
    return NextResponse.json({ success: false, error: { code: 'module_not_found', message: 'Module not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, module: mod });
}

/** Admin: delete a module and its assessment. */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const mod = await getModule(params.courseSlug, params.moduleId);
  if (!mod) {
    return NextResponse.json({ success: false, error: { code: 'module_not_found', message: 'Module not found.' } }, { status: 404 });
  }
  await deleteAssessmentForModule(params.moduleId);
  await deleteModule(params.courseSlug, params.moduleId);
  return NextResponse.json({ success: true });
}
