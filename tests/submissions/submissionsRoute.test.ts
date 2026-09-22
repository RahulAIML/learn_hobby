import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as submitPOST, GET as historyGET } from '@/app/api/assessments/[assessmentId]/submissions/route';
import { PUT as assessmentPUT } from '@/app/api/courses/[courseSlug]/modules/[moduleId]/assessment/route';
import { POST as createModulePOST } from '@/app/api/courses/[courseSlug]/modules/route';
import { createUser, enrollUser, listEnrollments } from '@/lib/auth/store';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { toPublicUser } from '@/lib/auth/types';

const COURSE = 'data-science';

let enrolledCookie: string;
let outsiderCookie: string;

beforeAll(async () => {
  const enrolledResult = await createUser({
    username: `submtest_${Date.now()}`,
    email: `submtest-${Date.now()}@gurukul.dev`,
    password: 'student123',
    name: 'Submission Test Student',
  });
  if (!('user' in enrolledResult)) throw new Error('setup failed');
  await enrollUser(enrolledResult.user.id, COURSE);
  enrolledCookie = `${SESSION_COOKIE}=${createSessionToken(toPublicUser(enrolledResult.user), await listEnrollments(enrolledResult.user.id))}`;

  const outsiderResult = await createUser({
    username: `submoutsider_${Date.now()}`,
    email: `submoutsider-${Date.now()}@gurukul.dev`,
    password: 'outsider123',
    name: 'Outsider',
  });
  if (!('user' in outsiderResult)) throw new Error('setup failed');
  outsiderCookie = `${SESSION_COOKIE}=${createSessionToken(toPublicUser(outsiderResult.user), await listEnrollments(outsiderResult.user.id))}`;
});

async function makeAssessment(): Promise<string> {
  const modRes = await createModulePOST(
    new NextRequest(`http://localhost/api/courses/${COURSE}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Submission Test Module ${Date.now()}` }),
    }),
    { params: { courseSlug: COURSE } }
  );
  const { module: mod } = await modRes.json();

  const assessmentRes = await assessmentPUT(
    new NextRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Lists vs Tuples Quiz',
        instructions: 'Explain the difference between Python lists and tuples, with one example of each.',
        rubric: 'Full credit requires a correct mutability explanation and one valid example per data structure.',
        maxScore: 100,
      }),
    }),
    { params: { courseSlug: COURSE, moduleId: mod.id } }
  );
  const { assessment } = await assessmentRes.json();
  return assessment.id;
}

function textFile(content: string, name = 'answer.txt'): File {
  return new File([content], name, { type: 'text/plain' });
}

function submitRequest(assessmentId: string, file: File | null, cookie?: string): NextRequest {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return new NextRequest(`http://localhost/api/assessments/${assessmentId}/submissions`, {
    method: 'POST',
    body: formData,
    headers: cookie ? { cookie } : undefined,
  });
}

describe('assessment submissions API', () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects an unauthenticated submission', async () => {
    const assessmentId = await makeAssessment();
    const res = await submitPOST(submitRequest(assessmentId, textFile('answer')), { params: { assessmentId } });
    expect(res.status).toBe(401);
  });

  it('rejects a submission from a student not enrolled in the course', async () => {
    const assessmentId = await makeAssessment();
    const res = await submitPOST(submitRequest(assessmentId, textFile('answer'), outsiderCookie), { params: { assessmentId } });
    expect(res.status).toBe(403);
  });

  it('rejects a submission with no file', async () => {
    const assessmentId = await makeAssessment();
    const res = await submitPOST(submitRequest(assessmentId, null, enrolledCookie), { params: { assessmentId } });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('missing_file');
  });

  it('404s for an unknown assessment', async () => {
    const res = await submitPOST(submitRequest('does-not-exist', textFile('answer'), enrolledCookie), {
      params: { assessmentId: 'does-not-exist' },
    });
    expect(res.status).toBe(404);
  });

  it(
    'evaluates a real submission with Gemini, persists it, and returns it in history',
    async () => {
      process.env.USE_MOCK_ASSESSMENT_EVALUATION = 'false';
      const assessmentId = await makeAssessment();

      const submission = textFile(
        'Lists are mutable — you can change their contents after creation, e.g. my_list = [1, 2, 3]; my_list.append(4). ' +
          'Tuples are immutable — once created they cannot be changed, e.g. my_point = (2, 3) for fixed coordinates.'
      );

      const res = await submitPOST(submitRequest(assessmentId, submission, enrolledCookie), { params: { assessmentId } });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(typeof body.evaluation.overall_score).toBe('number');
      expect(Array.isArray(body.evaluation.strengths)).toBe(true);

      const historyRes = await historyGET(
        new NextRequest(`http://localhost/api/assessments/${assessmentId}/submissions`, { headers: { cookie: enrolledCookie } }),
        { params: { assessmentId } }
      );
      const historyBody = await historyRes.json();
      expect(historyRes.status).toBe(200);
      expect(historyBody.submissions.length).toBeGreaterThan(0);
      expect(historyBody.submissions[0].evaluation).toBeTruthy();
    },
    60000
  );

  it('mock-mode evaluation still returns a structured, schema-valid result', async () => {
    process.env.USE_MOCK_ASSESSMENT_EVALUATION = 'true';
    const assessmentId = await makeAssessment();
    const res = await submitPOST(submitRequest(assessmentId, textFile('any answer text'), enrolledCookie), { params: { assessmentId } });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.evaluation.evaluation_status).toBe('ok');
    expect(body.evaluation.max_score).toBeGreaterThan(0);
  });
});
