import { NextRequest, NextResponse } from 'next/server';
import { getCourse, updateCourse, deleteCourse } from '@/lib/courses/store';
import { deleteAllDocuments } from '@/lib/courseDocuments/store';

export const runtime = 'nodejs';

interface RouteParams {
  params: { courseSlug: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_title: 'Please enter a course title.',
  course_not_found: 'Course not found.',
};

/**
 * Admin: rename a course. See /api/courses POST for the access-control note
 * (this project has no authentication system yet).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the request body.' } }, { status: 400 });
  }

  const title = typeof body === 'object' && body !== null && 'title' in body ? String((body as { title: unknown }).title ?? '') : '';

  const result = updateCourse(params.courseSlug, title);
  if ('error' in result) {
    const status = result.error === 'course_not_found' ? 404 : 400;
    return NextResponse.json({ success: false, error: { code: result.error, message: ERROR_MESSAGES[result.error] } }, { status });
  }

  return NextResponse.json({ success: true, course: result.course });
}

/** Admin: delete a course and all of its documents. */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const course = getCourse(params.courseSlug);
  if (!course) {
    return NextResponse.json({ success: false, error: { code: 'course_not_found', message: 'Course not found.' } }, { status: 404 });
  }

  deleteAllDocuments(params.courseSlug);
  deleteCourse(params.courseSlug);

  return NextResponse.json({ success: true });
}
