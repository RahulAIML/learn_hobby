import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { AuditLogTable } from '@/components/superAdmin/AuditLogTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Audit Logs | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminAuditLogsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout
      active="audit-logs"
      breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Audit Logs' }]}
      adminName={user!.name}
      adminEmail={user!.email}
    >
      <AuditLogTable />
    </SuperAdminLayout>
  );
}
