import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { CourseManager } from '@/components/admin/CourseManager';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Courses & Documents | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminCoursesPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="courses" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Courses & Documents' }]}>
      <CourseManager />
    </AdminLayout>
  );
}
