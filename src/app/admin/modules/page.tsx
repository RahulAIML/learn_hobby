import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ComingSoon } from '@/components/admin/ui/ComingSoon';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Modules | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminModulesPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="modules" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Modules' }]}>
      <ComingSoon
        title="Standalone module management is coming soon"
        description="Modules are currently created inline from Courses & Documents and the CBT generator. A dedicated management view lands in a future update."
      />
    </AdminLayout>
  );
}
