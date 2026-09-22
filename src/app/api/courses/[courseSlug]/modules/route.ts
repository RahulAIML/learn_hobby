import { NextRequest, NextResponse } from 'next/server';
import { getCourse } from '@/lib/courses/store';
import { listModules, createModule } from '@/lib/modules/store';
import { requireAdmin } from '@/lib/auth/adminGuard';

export const runtime = 'nodejs';

interface RouteParams {
  params: { courseSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const course = await getCourse(params.courseSlug);
  if (!course) {
    return NextResponse.json({ success: false, error: { code: 'course_not_found', message: 'Course not found.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true, modules: await listModules(params.courseSlug) });
}

/** Admin: create a module. */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const course = await getCourse(params.courseSlug);
  if (!course) {
    return NextResponse.json({ success: false, error: { code: 'course_not_found', message: 'Course not found.' } }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const title = typeof body === 'object' && body !== null && 'title' in body ? String((body as { title: unknown }).title ?? '').trim() : '';
  if (!title) {
    return NextResponse.json({ success: false, error: { code: 'invalid_title', message: 'Please enter a module title.' } }, { status: 400 });
  }

  const mod = await createModule(params.courseSlug, title);
  return NextResponse.json({ success: true, module: mod }, { status: 201 });
}
