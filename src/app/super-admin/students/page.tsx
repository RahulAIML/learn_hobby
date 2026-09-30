import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { StudentOverviewTable } from '@/components/superAdmin/StudentOverviewTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Students | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminStudentsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout
      active="students"
      breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Students' }]}
      adminName={user!.name}
      adminEmail={user!.email}
    >
      <StudentOverviewTable />
    </SuperAdminLayout>
  );
}
