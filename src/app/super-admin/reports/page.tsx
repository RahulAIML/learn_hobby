import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { ReportsTable } from '@/components/superAdmin/ReportsTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Reports | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminReportsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout active="reports" breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Reports' }]} adminName={user!.name} adminEmail={user!.email}>
      <ReportsTable />
    </SuperAdminLayout>
  );
}
