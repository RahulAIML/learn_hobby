import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ComingSoon } from '@/components/admin/ui/ComingSoon';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Settings | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="settings" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]}>
      <ComingSoon
        title="Platform settings are coming soon"
        description="Configuration for CBT defaults, branding, and platform-wide options lands in a future update."
      />
    </AdminLayout>
  );
}
