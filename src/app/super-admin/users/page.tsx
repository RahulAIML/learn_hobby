import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { UserInformationTable } from '@/components/superAdmin/UserInformationTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'User Information | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminUsersPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout
      active="users"
      breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'User Information' }]}
      adminName={user!.name}
      adminEmail={user!.email}
    >
      <UserInformationTable />
    </SuperAdminLayout>
  );
}
