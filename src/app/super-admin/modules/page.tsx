import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { ModuleOverviewTable } from '@/components/superAdmin/ModuleOverviewTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Modules | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminModulesPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout active="modules" breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Modules' }]} adminName={user!.name} adminEmail={user!.email}>
      <ModuleOverviewTable />
    </SuperAdminLayout>
  );
}
