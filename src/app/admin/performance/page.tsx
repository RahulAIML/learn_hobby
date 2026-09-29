import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ComingSoon } from '@/components/admin/ui/ComingSoon';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Performance | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminPerformancePage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="performance" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Performance' }]}>
      <ComingSoon
        title="Platform-wide performance analytics are coming soon"
        description="Per-student performance already exists under Students → Student Detail. A cross-platform analytics view lands in a future update."
      />
    </AdminLayout>
  );
}
