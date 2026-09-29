import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { CourseDocumentAdmin } from '@/components/admin/CourseDocumentAdmin';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { getCourse } from '@/data/courses';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

interface Props {
  params: { courseSlug: string };
}

export const metadata = {
  title: 'Manage Course Documents | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default async function AdminCourseDocumentsPage({ params }: Props) {
  const course = await getCourse(params.courseSlug);
  if (!course) notFound();

  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout
      active="courses"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Courses & Documents', href: '/admin/courses' }, { label: course.title }]}
    >
      <CourseDocumentAdmin courseSlug={course.slug} courseTitle={course.title} />
    </AdminLayout>
  );
}
