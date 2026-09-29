import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminStudentsList } from '@/components/admin/AdminStudentsList';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Students | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminStudentsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="students" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Students' }]}>
      <AdminStudentsList />
    </AdminLayout>
  );
}
