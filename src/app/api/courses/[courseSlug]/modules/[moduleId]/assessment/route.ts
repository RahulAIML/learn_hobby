import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getModule } from '@/lib/modules/store';
import { getAssessmentByModule, upsertAssessment, deleteAssessmentForModule } from '@/lib/assessments/store';
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
  const assessment = await getAssessmentByModule(params.moduleId);
  if (!assessment) {
    return NextResponse.json({ success: false, error: { code: 'assessment_not_found', message: 'This module has no assessment yet.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, assessment });
}

const upsertSchema = z.object({
  title: z.string().min(1).max(200),
  instructions: z.string().min(1).max(8000),
  rubric: z.string().max(4000).optional(),
  maxScore: z.number().min(1).max(1000).optional(),
  status: z.enum(['active', 'draft']).optional(),
});

/** Admin: create or update the module's assessment. */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const mod = await getModule(params.courseSlug, params.moduleId);
  if (!mod) {
    return NextResponse.json({ success: false, error: { code: 'module_not_found', message: 'Module not found.' } }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Title and instructions are required.' } }, { status: 400 });
  }

  const assessment = await upsertAssessment(params.moduleId, params.courseSlug, parsed.data);
  return NextResponse.json({ success: true, assessment });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const removed = await deleteAssessmentForModule(params.moduleId);
  if (!removed) {
    return NextResponse.json({ success: false, error: { code: 'assessment_not_found', message: 'This module has no assessment.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
