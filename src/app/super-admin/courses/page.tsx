import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { CourseOverviewTable } from '@/components/superAdmin/CourseOverviewTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Courses | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminCoursesPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout active="courses" breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Courses' }]} adminName={user!.name} adminEmail={user!.email}>
      <CourseOverviewTable />
    </SuperAdminLayout>
  );
}
