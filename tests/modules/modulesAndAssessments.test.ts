import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listModulesGET, POST as createModulePOST } from '@/app/api/courses/[courseSlug]/modules/route';
import { DELETE as deleteModuleDELETE } from '@/app/api/courses/[courseSlug]/modules/[moduleId]/route';
import { GET as assessmentGET, PUT as assessmentPUT, DELETE as assessmentDELETE } from '@/app/api/courses/[courseSlug]/modules/[moduleId]/assessment/route';
import { createCourse } from '@/lib/courses/store';
import { createAdminCookie } from '../helpers/adminAuth';

const COURSE = 'data-science';

let adminCookie: string;

beforeAll(async () => {
  await createCourse('Data Science');
  adminCookie = await createAdminCookie();
});

function jsonRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), cookie: adminCookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('modules API', () => {
  it('rejects module creation from a non-admin/unauthenticated caller', async () => {
    const res = await createModulePOST(
      new NextRequest(`http://localhost/api/courses/${COURSE}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'No Auth Module' }),
      }),
      { params: { courseSlug: COURSE } }
    );
    expect(res.status).toBe(401);
  });

  it('lists a created module', async () => {
    await createModulePOST(jsonRequest(`http://localhost/api/courses/${COURSE}/modules`, 'POST', { title: 'Module 1: Intro' }), {
      params: { courseSlug: COURSE },
    });
    const res = await listModulesGET(jsonRequest(`http://localhost/api/courses/${COURSE}/modules`, 'GET'), { params: { courseSlug: COURSE } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.modules.length).toBeGreaterThan(0);
  });

  it('creates and deletes a module', async () => {
    const createRes = await createModulePOST(jsonRequest(`http://localhost/api/courses/${COURSE}/modules`, 'POST', { title: 'Module 9: Test Module' }), {
      params: { courseSlug: COURSE },
    });
    const created = await createRes.json();
    expect(createRes.status).toBe(201);
    const moduleId = created.module.id;

    const deleteRes = await deleteModuleDELETE(jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${moduleId}`, 'DELETE'), {
      params: { courseSlug: COURSE, moduleId },
    });
    expect(deleteRes.status).toBe(200);
  });

  it('rejects an empty module title', async () => {
    const res = await createModulePOST(jsonRequest(`http://localhost/api/courses/${COURSE}/modules`, 'POST', { title: '  ' }), {
      params: { courseSlug: COURSE },
    });
    expect(res.status).toBe(400);
  });
});

describe('module assessment API', () => {
  it('creates a module, then creates/updates/reads/deletes its assessment', async () => {
    const createModuleRes = await createModulePOST(jsonRequest(`http://localhost/api/courses/${COURSE}/modules`, 'POST', { title: 'Assessment Test Module' }), {
      params: { courseSlug: COURSE },
    });
    const { module: mod } = await createModuleRes.json();

    // No assessment yet
    const notFoundRes = await assessmentGET(jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, 'GET'), {
      params: { courseSlug: COURSE, moduleId: mod.id },
    });
    expect(notFoundRes.status).toBe(404);

    // Create
    const putRes = await assessmentPUT(
      jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, 'PUT', {
        title: 'Quiz 1',
        instructions: 'Answer the questions.',
        rubric: 'Grade for correctness.',
        maxScore: 50,
      }),
      { params: { courseSlug: COURSE, moduleId: mod.id } }
    );
    const putBody = await putRes.json();
    expect(putRes.status).toBe(200);
    expect(putBody.assessment.maxScore).toBe(50);
    const assessmentId = putBody.assessment.id;

    // Update (same id, new title)
    const updateRes = await assessmentPUT(
      jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, 'PUT', {
        title: 'Quiz 1 (revised)',
        instructions: 'Answer the questions carefully.',
      }),
      { params: { courseSlug: COURSE, moduleId: mod.id } }
    );
    const updateBody = await updateRes.json();
    expect(updateBody.assessment.id).toBe(assessmentId);
    expect(updateBody.assessment.title).toBe('Quiz 1 (revised)');

    // Read
    const getRes = await assessmentGET(jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, 'GET'), {
      params: { courseSlug: COURSE, moduleId: mod.id },
    });
    expect(getRes.status).toBe(200);

    // Delete
    const deleteRes = await assessmentDELETE(jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, 'DELETE'), {
      params: { courseSlug: COURSE, moduleId: mod.id },
    });
    expect(deleteRes.status).toBe(200);
  });

  it('rejects an assessment with no instructions', async () => {
    const createModuleRes = await createModulePOST(jsonRequest(`http://localhost/api/courses/${COURSE}/modules`, 'POST', { title: 'Invalid Assessment Module' }), {
      params: { courseSlug: COURSE },
    });
    const { module: mod } = await createModuleRes.json();

    const res = await assessmentPUT(
      jsonRequest(`http://localhost/api/courses/${COURSE}/modules/${mod.id}/assessment`, 'PUT', { title: 'X', instructions: '' }),
      { params: { courseSlug: COURSE, moduleId: mod.id } }
    );
    expect(res.status).toBe(400);
  });
});
