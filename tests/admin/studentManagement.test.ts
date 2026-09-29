import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as adminStudentDetailGET, PATCH as adminStudentPATCH } from '@/app/api/admin/students/[id]/route';
import { GET as adminStudentsListGET } from '@/app/api/admin/students/route';
import {
  GET as enrollmentsGET,
  POST as enrollmentsPOST,
} from '@/app/api/admin/students/[id]/enrollments/route';
import { DELETE as unenrollDELETE } from '@/app/api/admin/students/[id]/enrollments/[courseSlug]/route';
import { POST as markPaidPOST, DELETE as unmarkPaidDELETE } from '@/app/api/admin/users/[id]/paid/route';
import { GET as dashboardGET } from '@/app/api/admin/dashboard/route';
import { createCourse } from '@/lib/courses/store';
import { createAdminCookie, createStudentCookie } from '../helpers/adminAuth';

const COURSE_A = `student-mgmt-a-${Date.now()}`;
const COURSE_B = `student-mgmt-b-${Date.now()}`;

let adminCookie: string;
let student: { userId: string; cookie: string };

function req(url: string, cookie: string, init?: { method?: string; body?: unknown }): NextRequest {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: { cookie, ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

describe('admin student management', () => {
  beforeAll(async () => {
    adminCookie = await createAdminCookie();
    student = await createStudentCookie(COURSE_A);
    const resultA = await createCourse(COURSE_A);
    if (!('course' in resultA)) throw new Error('course A setup failed');
    const resultB = await createCourse(COURSE_B);
    if (!('course' in resultB)) throw new Error('course B setup failed');
  });

  it('rejects non-admin callers on every student-management route', async () => {
    const patchRes = await adminStudentPATCH(req(`http://localhost/api/admin/students/${student.userId}`, student.cookie, { method: 'PATCH', body: { name: 'x' } }), {
      params: { id: student.userId },
    });
    expect(patchRes.status).toBe(403);

    const enrollRes = await enrollmentsPOST(
      req(`http://localhost/api/admin/students/${student.userId}/enrollments`, student.cookie, { method: 'POST', body: { courseSlug: COURSE_B } }),
      { params: { id: student.userId } }
    );
    expect(enrollRes.status).toBe(403);
  });

  it('admin can edit a student profile (name, mobile, age, goal) and it persists', async () => {
    const res = await adminStudentPATCH(
      req(`http://localhost/api/admin/students/${student.userId}`, adminCookie, {
        method: 'PATCH',
        body: { name: 'Renamed Student', mobile: '+15550001234', age: 30, goalCategory: 'career', goalSubcategory: 'job_search', goalOption: 'switch_career' },
      }),
      { params: { id: student.userId } }
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.profile.name).toBe('Renamed Student');
    expect(body.profile.age).toBe(30);
    expect(body.profile.goalOption).toBe('switch_career');

    const detailRes = await adminStudentDetailGET(req(`http://localhost/api/admin/students/${student.userId}`, adminCookie), { params: { id: student.userId } });
    const detailBody = await detailRes.json();
    expect(detailBody.profile.name).toBe('Renamed Student');
    expect(detailBody.profile.mobile).toBe('+15550001234');
  });

  it('admin rejects an invalid goal path on edit', async () => {
    const res = await adminStudentPATCH(
      req(`http://localhost/api/admin/students/${student.userId}`, adminCookie, {
        method: 'PATCH',
        body: { goalCategory: 'career', goalSubcategory: 'job_search', goalOption: 'not_a_real_option' },
      }),
      { params: { id: student.userId } }
    );
    expect(res.status).toBe(400);
  });

  it('admin can enroll and unenroll a student in a course', async () => {
    const enrollRes = await enrollmentsPOST(
      req(`http://localhost/api/admin/students/${student.userId}/enrollments`, adminCookie, { method: 'POST', body: { courseSlug: COURSE_B } }),
      { params: { id: student.userId } }
    );
    const enrollBody = await enrollRes.json();
    expect(enrollRes.status).toBe(201);
    expect(enrollBody.enrollments).toContain(COURSE_A);
    expect(enrollBody.enrollments).toContain(COURSE_B);

    const listRes = await enrollmentsGET(req(`http://localhost/api/admin/students/${student.userId}/enrollments`, adminCookie), { params: { id: student.userId } });
    const listBody = await listRes.json();
    expect(listBody.enrollments).toContain(COURSE_B);

    const unenrollRes = await unenrollDELETE(req(`http://localhost/api/admin/students/${student.userId}/enrollments/${COURSE_B}`, adminCookie, { method: 'DELETE' }), {
      params: { id: student.userId, courseSlug: COURSE_B },
    });
    expect(unenrollRes.status).toBe(200);

    const listAfterRes = await enrollmentsGET(req(`http://localhost/api/admin/students/${student.userId}/enrollments`, adminCookie), { params: { id: student.userId } });
    const listAfterBody = await listAfterRes.json();
    expect(listAfterBody.enrollments).not.toContain(COURSE_B);
    expect(listAfterBody.enrollments).toContain(COURSE_A);
  });

  it('unenrolling from a course the student is not enrolled in returns 404', async () => {
    const res = await unenrollDELETE(req(`http://localhost/api/admin/students/${student.userId}/enrollments/${COURSE_B}`, adminCookie, { method: 'DELETE' }), {
      params: { id: student.userId, courseSlug: COURSE_B },
    });
    expect(res.status).toBe(404);
  });

  it('admin can mark and unmark a student as paid, reflected in the student list and detail view', async () => {
    const markRes = await markPaidPOST(req(`http://localhost/api/admin/users/${student.userId}/paid`, adminCookie, { method: 'POST', body: { plan: 'premium' } }), {
      params: { id: student.userId },
    });
    expect(markRes.status).toBe(200);

    const listRes = await adminStudentsListGET(req('http://localhost/api/admin/students', adminCookie));
    const listBody = await listRes.json();
    const found = listBody.students.find((s: { id: string }) => s.id === student.userId);
    expect(found.isPaid).toBe(true);

    const detailRes = await adminStudentDetailGET(req(`http://localhost/api/admin/students/${student.userId}`, adminCookie), { params: { id: student.userId } });
    const detailBody = await detailRes.json();
    expect(detailBody.paid?.plan).toBe('premium');

    const unmarkRes = await unmarkPaidDELETE(req(`http://localhost/api/admin/users/${student.userId}/paid`, adminCookie, { method: 'DELETE' }), { params: { id: student.userId } });
    expect(unmarkRes.status).toBe(200);

    const detailAfterRes = await adminStudentDetailGET(req(`http://localhost/api/admin/students/${student.userId}`, adminCookie), { params: { id: student.userId } });
    const detailAfterBody = await detailAfterRes.json();
    expect(detailAfterBody.paid).toBeNull();
  });

  it('admin dashboard returns real, internally-consistent aggregate counts', async () => {
    const res = await dashboardGET(req('http://localhost/api/admin/dashboard', adminCookie));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.overview.totalStudents).toBeGreaterThanOrEqual(1);
    expect(body.overview.totalCourses).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(body.recentAssessments)).toBe(true);
    expect(Array.isArray(body.recentActivity)).toBe(true);
    expect(Array.isArray(body.recentStudents)).toBe(true);
  });

  it('non-admin cannot view the dashboard aggregates', async () => {
    const res = await dashboardGET(req('http://localhost/api/admin/dashboard', student.cookie));
    expect(res.status).toBe(403);
  });
});
