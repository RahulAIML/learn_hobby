import { NextRequest, NextResponse } from 'next/server';
import { getCourse } from '@/data/courses';
import { validateUploadedFile } from '@/lib/assessment/fileValidation.server';
import { listDocuments, createDocument } from '@/lib/courseDocuments/store';
import { toSummary } from '@/lib/courseDocuments/types';
import { getSessionUser } from '@/lib/auth/session';
import { isEnrolled } from '@/lib/auth/store';

export const runtime = 'nodejs';

interface RouteParams {
  params: { courseSlug: string };
}

/**
 * List documents for a course.
 *
 * ACCESS CONTROL: a signed-in student must be enrolled in the course.
 * An anonymous caller (no session cookie) is allowed through — this is
 * what the admin dashboard uses today, since /admin has no admin-role
 * auth yet (documented, disclosed limitation there, unchanged by this
 * feature). A logged-in student who is NOT enrolled is rejected with 403.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const course = getCourse(params.courseSlug);
  if (!course) {
    return NextResponse.json({ success: false, error: { code: 'course_not_found', message: 'Course not found.' } }, { status: 404 });
  }

  const user = getSessionUser(req);
  if (user && user.role === 'student' && !isEnrolled(user.id, params.courseSlug)) {
    return NextResponse.json({ success: false, error: { code: 'forbidden', message: 'You are not enrolled in this course.' } }, { status: 403 });
  }

  const documents = listDocuments(params.courseSlug).map(toSummary);
  return NextResponse.json({ success: true, course, documents });
}

/**
 * Admin: upload a new document to a course.
 *
 * NOTE ON ACCESS CONTROL: this project has no authentication/authorization
 * system yet (see /login — an honest placeholder, not real auth). There is
 * therefore no way to genuinely verify "the caller is an admin" here. This
 * endpoint is real, working CRUD — it is deliberately NOT wired behind a
 * fake permission check that would only look secure. When real auth exists,
 * add an admin-role check here before createDocument().
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const course = getCourse(params.courseSlug);
  if (!course) {
    return NextResponse.json({ success: false, error: { code: 'course_not_found', message: 'Course not found.' } }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Could not read the submitted form data.' } }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: { code: 'missing_file', message: 'Please attach a document to upload.' } }, { status: 400 });
  }

  const title = formData.get('title')?.toString().trim() || file.name;
  const moduleId = formData.get('moduleId')?.toString().trim() || null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = await validateUploadedFile(file.name, buffer);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: { code: 'invalid_file', message: validation.error } }, { status: 400 });
  }

  const doc = createDocument({
    courseSlug: params.courseSlug,
    moduleId,
    title,
    filename: validation.safeFilename ?? file.name,
    mimeType: validation.detectedMime ?? file.type,
    data: buffer.toString('base64'),
    sizeBytes: buffer.length,
  });

  return NextResponse.json({ success: true, document: toSummary(doc) }, { status: 201 });
}
