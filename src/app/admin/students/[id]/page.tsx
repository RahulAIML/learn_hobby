import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminStudentDetail } from '@/components/admin/AdminStudentDetail';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Student Detail | Gurukul Admin',
  robots: { index: false, follow: false },
};

interface Props {
  params: { id: string };
}

export default function AdminStudentDetailPage({ params }: Props) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout
      active="students"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Students', href: '/admin/students' }, { label: 'Student Detail' }]}
    >
      <AdminStudentDetail studentId={params.id} />
    </AdminLayout>
  );
}
