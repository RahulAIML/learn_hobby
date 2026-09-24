import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as profileGET, PATCH as profilePATCH } from '@/app/api/student/profile/route';
import { GET as performanceGET } from '@/app/api/student/performance/route';
import { GET as historyGET } from '@/app/api/student/assessments/history/route';
import { GET as studentAttemptGET } from '@/app/api/student/attempts/[id]/route';
import { GET as adminStudentsGET } from '@/app/api/admin/students/route';
import { GET as adminStudentDetailGET } from '@/app/api/admin/students/[id]/route';
import { POST as startAttemptPOST } from '@/app/api/cbt-assessments/[id]/attempt/route';
import { PUT as saveAnswerPUT } from '@/app/api/cbt-attempts/[id]/answers/route';
import { POST as submitAttemptPOST } from '@/app/api/cbt-attempts/[id]/submit/route';
import { createCourse } from '@/lib/courses/store';
import { createModule } from '@/lib/modules/store';
import { createCbtAssessment, addQuestion, updateCbtAssessment } from '@/lib/cbt/store';
import { createStudentCookie, createAdminCookie } from '../helpers/adminAuth';

const COURSE = `cbt-perf-${Date.now()}`;

let studentA: { userId: string; cookie: string };
let studentB: { userId: string; cookie: string };
let adminCookie: string;
let assessmentId: string;

function req(url: string, cookie: string, init?: { method?: string; body?: unknown }): NextRequest {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: { cookie, ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

async function takeAndSubmitAttempt(cookie: string): Promise<string> {
  const startRes = await startAttemptPOST(req(`http://localhost/api/cbt-assessments/${assessmentId}/attempt`, cookie, { method: 'POST' }), {
    params: { id: assessmentId },
  });
  if (!startRes) throw new Error('startAttemptPOST returned no response');
  const startBody = await startRes.json();
  expect(startRes.status).toBe(200);
  const attemptId = startBody.attempt.id as string;
  const questionId = startBody.questions[0].id as string;

  const answerRes = await saveAnswerPUT(
    req(`http://localhost/api/cbt-attempts/${attemptId}/answers`, cookie, { method: 'PUT', body: { questionId, answer: 'Paris', markedForReview: false } }),
    { params: { id: attemptId } }
  );
  expect(answerRes.status).toBe(200);

  const submitRes = await submitAttemptPOST(req(`http://localhost/api/cbt-attempts/${attemptId}/submit`, cookie, { method: 'POST' }), {
    params: { id: attemptId },
  });
  expect(submitRes.status).toBe(200);
  return attemptId;
}

describe('student profile + multi-CBT performance tracking', () => {
  beforeAll(async () => {
    const courseResult = await createCourse(COURSE);
    if (!('course' in courseResult)) throw new Error('course setup failed');
    const mod = await createModule(COURSE, 'Geography Basics');

    adminCookie = await createAdminCookie();
    studentA = await createStudentCookie(COURSE);
    studentB = await createStudentCookie(COURSE);

    const assessment = await createCbtAssessment(
      {
        courseSlug: COURSE,
        moduleId: mod.id,
        title: 'Capitals Quiz',
        topic: 'World Capitals',
        description: 'Basic geography',
        difficulty: 'beginner',
        timeLimitMinutes: 30,
        mcqCount: 0,
        fillBlankCount: 1,
        optionsPerMcq: 4,
      },
      studentA.userId
    );
    assessmentId = assessment.id;

    await addQuestion(assessmentId, {
      type: 'fill_blank',
      questionText: 'The capital of France is __________.',
      correctAnswer: 'Paris',
      acceptableAnswers: ['paris'],
      explanation: 'Paris is the capital of France.',
      difficulty: 'beginner',
      topic: 'World Capitals',
      orderIndex: 1,
    });

    await updateCbtAssessment(assessmentId, { status: 'published' });
  });

  it('profile: age + goal persist and mark the profile completed', async () => {
    const patchRes = await profilePATCH(
      req('http://localhost/api/student/profile', studentA.cookie, {
        method: 'PATCH',
        body: { age: 22, goalCategory: 'career', goalSubcategory: 'job_search', goalOption: 'first_job' },
      })
    );
    const patchBody = await patchRes.json();
    expect(patchRes.status).toBe(200);
    expect(patchBody.profile.age).toBe(22);
    expect(patchBody.profile.goalOption).toBe('first_job');
    expect(patchBody.profile.profileCompletedAt).toBeTruthy();

    const getRes = await profileGET(req('http://localhost/api/student/profile', studentA.cookie));
    const getBody = await getRes.json();
    expect(getBody.profile.age).toBe(22);
    expect(getBody.profile.goalCategory).toBe('career');
  });

  it('profile: rejects an out-of-range age and an invalid goal path', async () => {
    const badAge = await profilePATCH(req('http://localhost/api/student/profile', studentA.cookie, { method: 'PATCH', body: { age: 5 } }));
    expect(badAge.status).toBe(400);

    const badGoal = await profilePATCH(
      req('http://localhost/api/student/profile', studentA.cookie, {
        method: 'PATCH',
        body: { goalCategory: 'career', goalSubcategory: 'job_search', goalOption: 'not_a_real_option' },
      })
    );
    expect(badGoal.status).toBe(400);
  });

  it('profile: requires authentication', async () => {
    const res = await profileGET(new NextRequest('http://localhost/api/student/profile'));
    expect(res.status).toBe(401);
  });

  it('CBT: taking a second assessment creates a NEW attempt and never overwrites the first', async () => {
    const attempt1Id = await takeAndSubmitAttempt(studentA.cookie);
    const attempt2Id = await takeAndSubmitAttempt(studentA.cookie);

    expect(attempt1Id).not.toBe(attempt2Id);

    const result1 = await studentAttemptGET(req(`http://localhost/api/student/attempts/${attempt1Id}`, studentA.cookie), { params: { id: attempt1Id } });
    const body1 = await result1.json();
    expect(result1.status).toBe(200);
    expect(body1.attempt.id).toBe(attempt1Id);

    const result2 = await studentAttemptGET(req(`http://localhost/api/student/attempts/${attempt2Id}`, studentA.cookie), { params: { id: attempt2Id } });
    const body2 = await result2.json();
    expect(result2.status).toBe(200);
    expect(body2.attempt.id).toBe(attempt2Id);

    // Refetching attempt 1 after attempt 2 was submitted must still show attempt 1's own data.
    const result1Again = await studentAttemptGET(req(`http://localhost/api/student/attempts/${attempt1Id}`, studentA.cookie), { params: { id: attempt1Id } });
    const body1Again = await result1Again.json();
    expect(body1Again.attempt.id).toBe(attempt1Id);
    expect(body1Again.attempt.submittedAt).toBe(body1.attempt.submittedAt);

    const historyRes = await historyGET(req('http://localhost/api/student/assessments/history', studentA.cookie));
    const historyBody = await historyRes.json();
    expect(historyRes.status).toBe(200);
    const attemptIds = historyBody.history.map((h: { attemptId: string }) => h.attemptId);
    expect(attemptIds).toContain(attempt1Id);
    expect(attemptIds).toContain(attempt2Id);
    expect(historyBody.history.length).toBeGreaterThanOrEqual(2);

    const perfRes = await performanceGET(req('http://localhost/api/student/performance', studentA.cookie));
    const perfBody = await perfRes.json();
    expect(perfRes.status).toBe(200);
    expect(perfBody.performance.totalAttempts).toBeGreaterThanOrEqual(2);
  });

  it('security: a student cannot read another student’s attempt result', async () => {
    const attemptId = await takeAndSubmitAttempt(studentA.cookie);
    const res = await studentAttemptGET(req(`http://localhost/api/student/attempts/${attemptId}`, studentB.cookie), { params: { id: attemptId } });
    expect(res.status).toBe(404);
  });

  it('admin: sees the student in the list with real aggregate performance, and the full attempt history in detail', async () => {
    const listRes = await adminStudentsGET(req('http://localhost/api/admin/students', adminCookie));
    const listBody = await listRes.json();
    expect(listRes.status).toBe(200);
    const found = listBody.students.find((s: { id: string }) => s.id === studentA.userId);
    expect(found).toBeTruthy();
    expect(found.totalAttempts).toBeGreaterThanOrEqual(1);

    const detailRes = await adminStudentDetailGET(req(`http://localhost/api/admin/students/${studentA.userId}`, adminCookie), {
      params: { id: studentA.userId },
    });
    const detailBody = await detailRes.json();
    expect(detailRes.status).toBe(200);
    expect(detailBody.attempts.length).toBeGreaterThanOrEqual(1);
  });

  it('admin: non-admin cannot list students', async () => {
    const res = await adminStudentsGET(req('http://localhost/api/admin/students', studentA.cookie));
    expect(res.status).toBe(403);
  });
});
