import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { SettingsPanel } from '@/components/superAdmin/SettingsPanel';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Settings | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminSettingsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout active="settings" breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Settings' }]} adminName={user!.name} adminEmail={user!.email}>
      <SettingsPanel />
    </SuperAdminLayout>
  );
}
