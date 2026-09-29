import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminUsersList } from '@/components/admin/AdminUsersList';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Registered Users | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout active="users" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Registered Users' }]}>
      <AdminUsersList />
    </AdminLayout>
  );
}
