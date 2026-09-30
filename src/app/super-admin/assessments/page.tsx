import React from 'react';
import { cookies } from 'next/headers';
import { SuperAdminLayout } from '@/components/superAdmin/layout/SuperAdminLayout';
import { AssessmentOverviewTable } from '@/components/superAdmin/AssessmentOverviewTable';
import { getSuperAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Assessments | Gurukul Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminAssessmentsPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getSuperAdminGate(user);
  if (gate) return gate;

  return (
    <SuperAdminLayout
      active="assessments"
      breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Assessments' }]}
      adminName={user!.name}
      adminEmail={user!.email}
    >
      <AssessmentOverviewTable />
    </SuperAdminLayout>
  );
}
