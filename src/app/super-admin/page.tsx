import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { SuperAdminDashboard } from '@/components/superAdmin/SuperAdminDashboard';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Super Admin Control Center | Gurukul',
  robots: { index: false, follow: false },
};

export default function SuperAdminDashboardPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout active="dashboard" breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Dashboard' }]} adminName={user!.name} adminEmail={user!.email}>
      <SuperAdminDashboard adminName={user!.name} />
    </SuperAdminLayout>
  );
}
