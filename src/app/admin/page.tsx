import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { DashboardHome } from '@/components/admin/DashboardHome';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Admin Dashboard | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      <DashboardHome adminName={user!.name} />
    </AdminLayout>
  );
}
