import React from 'react';
import { cookies } from 'next/headers';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { CbtReview } from '@/components/admin/CbtReview';
import { getAdminGate } from '@/components/admin/ui/AdminGate';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

export const metadata = {
  title: 'Review CBT Assessment | Gurukul Admin',
  robots: { index: false, follow: false },
};

interface Props {
  params: { id: string };
}

export default function AdminCbtReviewPage({ params }: Props) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  const gate = getAdminGate(user);
  if (gate) return gate;

  return (
    <AdminLayout
      active="assessments"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Assessments', href: '/admin/cbt' }, { label: 'Review' }]}
    >
      <CbtReview assessmentId={params.id} />
    </AdminLayout>
  );
}
