import { NextRequest, NextResponse } from 'next/server';
import { getModule, deleteModule } from '@/lib/modules/store';
import { deleteAssessmentForModule } from '@/lib/assessments/store';

export const runtime = 'nodejs';

interface RouteParams {
  params: { courseSlug: string; moduleId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const mod = getModule(params.courseSlug, params.moduleId);
  if (!mod) {
    return NextResponse.json({ success: false, error: { code: 'module_not_found', message: 'Module not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, module: mod });
}

/** Admin: delete a module and its assessment. */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const mod = getModule(params.courseSlug, params.moduleId);
  if (!mod) {
    return NextResponse.json({ success: false, error: { code: 'module_not_found', message: 'Module not found.' } }, { status: 404 });
  }
  deleteAssessmentForModule(params.moduleId);
  deleteModule(params.courseSlug, params.moduleId);
  return NextResponse.json({ success: true });
}
