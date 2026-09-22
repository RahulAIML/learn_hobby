import { NextRequest, NextResponse } from 'next/server';
import { listCourses, createCourse } from '@/lib/courses/store';
import { requireAdmin } from '@/lib/auth/adminGuard';

export const runtime = 'nodejs';

/** List all courses in the catalog. */
export async function GET() {
  return NextResponse.json({ success: true, courses: await listCourses() });
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_title: 'Please enter a course title.',
  slug_taken: 'A course with that title (or a very similar one) already exists.',
};

/** Admin: create a new course. */
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const title = typeof body === 'object' && body !== null && 'title' in body ? String((body as { title: unknown }).title ?? '') : '';

  const result = await createCourse(title);
  if ('error' in result) {
    return NextResponse.json({ success: false, error: { code: result.error, message: ERROR_MESSAGES[result.error] } }, { status: 400 });
  }

  return NextResponse.json({ success: true, course: result.course }, { status: 201 });
}
