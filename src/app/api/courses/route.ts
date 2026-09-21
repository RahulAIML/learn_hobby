import { NextRequest, NextResponse } from 'next/server';
import { listCourses, createCourse } from '@/lib/courses/store';

export const runtime = 'nodejs';

/** List all courses in the catalog. */
export async function GET() {
  return NextResponse.json({ success: true, courses: listCourses() });
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_title: 'Please enter a course title.',
  slug_taken: 'A course with that title (or a very similar one) already exists.',
};

/**
 * Admin: create a new course.
 *
 * NOTE ON ACCESS CONTROL: same as the course-documents routes — this project
 * has no authentication system yet, so there is no real way to verify the
 * caller is an admin. Deliberately not wired behind a fake permission check.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const title = typeof body === 'object' && body !== null && 'title' in body ? String((body as { title: unknown }).title ?? '') : '';

  const result = createCourse(title);
  if ('error' in result) {
    return NextResponse.json({ success: false, error: { code: result.error, message: ERROR_MESSAGES[result.error] } }, { status: 400 });
  }

  return NextResponse.json({ success: true, course: result.course }, { status: 201 });
}
