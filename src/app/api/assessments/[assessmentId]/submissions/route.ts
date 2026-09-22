import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAssessmentById } from '@/lib/assessments/store';
import { createSubmission, saveEvaluation, markFailed, listSubmissionsForStudent } from '@/lib/submissions/store';
import { evaluateAssessment, AssessmentServiceError } from '@/lib/assessment/assessmentService';
import { checkRateLimit } from '@/lib/assessment/rateLimit';
import { getMaxUploadSizeMb } from '@/lib/assessment/fileValidation';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RouteParams {
  params: { assessmentId: string };
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * Submit a completed assessment for evaluation.
 *
 * AUTHORIZATION: the student is derived from the signed session cookie —
 * never from a client-supplied id — and must be enrolled in the course
 * the assessment's module belongs to. Both checks happen here, server-side,
 * before any file is read or the submission is recorded.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = getSessionUser(req);
  if (!user) {
    return errorResponse('unauthenticated', 'Please sign in to submit an assessment.', 401);
  }

  const assessment = await getAssessmentById(params.assessmentId);
  if (!assessment || assessment.status !== 'active') {
    return errorResponse('assessment_not_found', 'Assessment not found.', 404);
  }

  if (!user.enrollments.includes(assessment.courseSlug)) {
    return errorResponse('forbidden', 'You are not enrolled in this course.', 403);
  }

  const rate = checkRateLimit(user.id);
  if (!rate.allowed) {
    return errorResponse('rate_limited', `Too many submissions. Please wait ${rate.retryAfterSeconds}s and try again.`, 429);
  }

  const maxMb = getMaxUploadSizeMb();
  const declaredLength = req.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > maxMb * 1024 * 1024 * 1.5) {
    return errorResponse('file_too_large', `Upload exceeds the ${maxMb} MB limit.`, 413);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse('invalid_request', 'Could not read the submitted form data.', 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return errorResponse('missing_file', 'Please attach your completed assessment.', 400);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return errorResponse('invalid_file', 'Could not read the uploaded file.', 400);
  }

  if (buffer.length > maxMb * 1024 * 1024) {
    return errorResponse('file_too_large', `File exceeds the ${maxMb} MB limit.`, 413);
  }

  const submission = await createSubmission({
    assessmentId: assessment.id,
    moduleId: assessment.moduleId,
    courseSlug: assessment.courseSlug,
    studentId: user.id,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: buffer.length,
  });

  try {
    const evaluation = await evaluateAssessment({
      filename: file.name,
      buffer,
      assessmentTitle: assessment.title,
      assessmentInstructions: assessment.instructions,
      rubric: assessment.rubric,
    });

    await saveEvaluation(submission.id, evaluation);
    return NextResponse.json({ success: true, submissionId: submission.id, evaluation }, { status: 201 });
  } catch (err) {
    await markFailed(submission.id);
    if (err instanceof AssessmentServiceError) {
      return errorResponse(err.code, err.message, err.status);
    }
    console.error('[assessments/submissions] unexpected error', err);
    return errorResponse('internal_error', 'Something went wrong while evaluating your submission.', 500);
  }
}

/** Submission history for the signed-in student on this assessment. */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = getSessionUser(req);
  if (!user) {
    return errorResponse('unauthenticated', 'Please sign in.', 401);
  }

  const assessment = await getAssessmentById(params.assessmentId);
  if (!assessment) {
    return errorResponse('assessment_not_found', 'Assessment not found.', 404);
  }

  if (!user.enrollments.includes(assessment.courseSlug)) {
    return errorResponse('forbidden', 'You are not enrolled in this course.', 403);
  }

  const submissions = await listSubmissionsForStudent(assessment.id, user.id);
  return NextResponse.json({ success: true, submissions });
}
