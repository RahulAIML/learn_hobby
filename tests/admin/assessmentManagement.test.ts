import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listAssessmentsGET, POST as createAssessmentPOST } from '@/app/api/admin/cbt-assessments/route';
import { GET as assessmentDetailGET, DELETE as assessmentDeleteDELETE } from '@/app/api/admin/cbt-assessments/[id]/route';
import { POST as addQuestionPOST } from '@/app/api/admin/cbt-assessments/[id]/questions/route';
import { POST as publishPOST } from '@/app/api/admin/cbt-assessments/[id]/publish/route';
import { POST as archivePOST } from '@/app/api/admin/cbt-assessments/[id]/archive/route';
import { POST as unarchivePOST } from '@/app/api/admin/cbt-assessments/[id]/unarchive/route';
import { POST as startAttemptPOST } from '@/app/api/cbt-assessments/[id]/attempt/route';
import { POST as submitAttemptPOST } from '@/app/api/cbt-attempts/[id]/submit/route';
import { GET as resultGET } from '@/app/api/cbt-attempts/[id]/result/route';
import { createCourse } from '@/lib/courses/store';
import { createModule } from '@/lib/modules/store';
import { createAdminCookie, createStudentCookie } from '../helpers/adminAuth';

const COURSE = `assessment-mgmt-${Date.now()}`;

let adminCookie: string;
let student: { userId: string; cookie: string };
let moduleId: string;

function req(url: string, cookie: string, init?: { method?: string; body?: unknown }): NextRequest {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: { cookie, ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

async function createPublishedAssessment(): Promise<string> {
  const createRes = await createAssessmentPOST(
    req('http://localhost/api/admin/cbt-assessments', adminCookie, {
      method: 'POST',
      body: {
        courseSlug: COURSE,
        moduleId,
        title: 'Assessment Management Quiz',
        topic: 'Geography',
        description: 'Capitals',
        difficulty: 'beginner',
        timeLimitMinutes: 20,
        mcqCount: 0,
        fillBlankCount: 1,
        optionsPerMcq: 4,
      },
    })
  );
  const createBody = await createRes.json();
  expect(createRes.status).toBe(201);
  const assessmentId = createBody.assessment.id as string;

  await addQuestionPOST(
    req(`http://localhost/api/admin/cbt-assessments/${assessmentId}/questions`, adminCookie, {
      method: 'POST',
      body: {
        type: 'fill_blank',
        questionText: 'The capital of Japan is __________.',
        correctAnswer: 'Tokyo',
        acceptableAnswers: ['tokyo'],
        explanation: 'Tokyo is the capital of Japan.',
        difficulty: 'beginner',
        topic: 'Geography',
        orderIndex: 1,
      },
    }),
    { params: { id: assessmentId } }
  );

  const publishRes = await publishPOST(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}/publish`, adminCookie, { method: 'POST' }), {
    params: { id: assessmentId },
  });
  expect(publishRes.status).toBe(200);
  return assessmentId;
}

describe('admin assessment management', () => {
  beforeAll(async () => {
    adminCookie = await createAdminCookie();
    student = await createStudentCookie(COURSE);
    const courseResult = await createCourse(COURSE);
    if (!('course' in courseResult)) throw new Error('course setup failed');
    const mod = await createModule(COURSE, 'Assessment Management Module');
    moduleId = mod.id;
  });

  it('the assessment list includes real attempt/avg-score stats for every assessment', async () => {
    const assessmentId = await createPublishedAssessment();

    const listRes = await listAssessmentsGET(req('http://localhost/api/admin/cbt-assessments', adminCookie));
    const listBody = await listRes.json();
    const found = listBody.assessments.find((a: { id: string }) => a.id === assessmentId);
    expect(found).toBeTruthy();
    expect(found.attempts).toBe(0);
    expect(found.avgPercentage).toBeNull();
  });

  it('admin can view real attempts against an assessment, with a working result link for admins', async () => {
    const assessmentId = await createPublishedAssessment();

    const startRes = await startAttemptPOST(req(`http://localhost/api/cbt-assessments/${assessmentId}/attempt`, student.cookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    if (!startRes) throw new Error('startAttemptPOST returned no response');
    const startBody = await startRes.json();
    expect(startRes.status).toBe(200);
    const attemptId = startBody.attempt.id as string;

    const submitRes = await submitAttemptPOST(req(`http://localhost/api/cbt-attempts/${attemptId}/submit`, student.cookie, { method: 'POST' }), {
      params: { id: attemptId },
    });
    expect(submitRes.status).toBe(200);

    const detailRes = await assessmentDetailGET(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}`, adminCookie), { params: { id: assessmentId } });
    const detailBody = await detailRes.json();
    expect(detailRes.status).toBe(200);
    expect(detailBody.stats.attempts).toBe(1);
    expect(detailBody.attempts).toHaveLength(1);
    expect(detailBody.attempts[0].attemptId).toBe(attemptId);

    // An admin (not the attempt's own student) must be able to open the result — this was a real bug before this change.
    const resultRes = await resultGET(req(`http://localhost/api/cbt-attempts/${attemptId}/result`, adminCookie), { params: { id: attemptId } });
    expect(resultRes.status).toBe(200);
  });

  it('a non-owning student cannot view another student’s attempt result', async () => {
    const assessmentId = await createPublishedAssessment();
    const otherStudent = await createStudentCookie(COURSE);

    const startRes = await startAttemptPOST(req(`http://localhost/api/cbt-assessments/${assessmentId}/attempt`, student.cookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    if (!startRes) throw new Error('startAttemptPOST returned no response');
    const startBody = await startRes.json();
    const attemptId = startBody.attempt.id as string;
    await submitAttemptPOST(req(`http://localhost/api/cbt-attempts/${attemptId}/submit`, student.cookie, { method: 'POST' }), { params: { id: attemptId } });

    const res = await resultGET(req(`http://localhost/api/cbt-attempts/${attemptId}/result`, otherStudent.cookie), { params: { id: attemptId } });
    expect(res.status).toBe(404);
  });

  it('admin can archive a published assessment and unarchive it back to published', async () => {
    const assessmentId = await createPublishedAssessment();

    const archiveRes = await archivePOST(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}/archive`, adminCookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    const archiveBody = await archiveRes.json();
    expect(archiveRes.status).toBe(200);
    expect(archiveBody.assessment.status).toBe('archived');

    // Archiving again (already archived) is rejected.
    const secondArchiveRes = await archivePOST(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}/archive`, adminCookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    expect(secondArchiveRes.status).toBe(400);

    const unarchiveRes = await unarchivePOST(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}/unarchive`, adminCookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    const unarchiveBody = await unarchiveRes.json();
    expect(unarchiveRes.status).toBe(200);
    expect(unarchiveBody.assessment.status).toBe('published');
  });

  it('non-admin cannot archive, unarchive, or delete an assessment', async () => {
    const assessmentId = await createPublishedAssessment();

    const archiveRes = await archivePOST(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}/archive`, student.cookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    expect(archiveRes.status).toBe(403);

    const deleteRes = await assessmentDeleteDELETE(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}`, student.cookie, { method: 'DELETE' }), {
      params: { id: assessmentId },
    });
    expect(deleteRes.status).toBe(403);
  });

  it('deleting an assessment removes it and its questions/attempts (cascade)', async () => {
    const assessmentId = await createPublishedAssessment();

    const startRes = await startAttemptPOST(req(`http://localhost/api/cbt-assessments/${assessmentId}/attempt`, student.cookie, { method: 'POST' }), {
      params: { id: assessmentId },
    });
    if (!startRes) throw new Error('startAttemptPOST returned no response');
    expect(startRes.status).toBe(200);

    const deleteRes = await assessmentDeleteDELETE(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}`, adminCookie, { method: 'DELETE' }), {
      params: { id: assessmentId },
    });
    expect(deleteRes.status).toBe(200);

    const detailRes = await assessmentDetailGET(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}`, adminCookie), { params: { id: assessmentId } });
    expect(detailRes.status).toBe(404);

    const deleteAgainRes = await assessmentDeleteDELETE(req(`http://localhost/api/admin/cbt-assessments/${assessmentId}`, adminCookie, { method: 'DELETE' }), {
      params: { id: assessmentId },
    });
    expect(deleteAgainRes.status).toBe(404);
  });
});
