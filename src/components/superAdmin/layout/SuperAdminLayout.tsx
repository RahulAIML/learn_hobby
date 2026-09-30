'use client';

import React, { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminMobileSidebar } from './SuperAdminMobileSidebar';
import { SuperAdminTopbar, type Breadcrumb } from './SuperAdminTopbar';

interface SuperAdminLayoutProps {
  /** Key from src/lib/superAdmin/navigation.ts identifying the active sidebar item. */
  active: string;
  breadcrumbs: Breadcrumb[];
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}

/**
 * Shared shell for every /super-admin/* page — visually distinct from the
 * regular Admin Panel shell (dark sidebar, "Super Admin" role badge) to
 * communicate elevated authority. A page is responsible for its own auth
 * gate before rendering this — same requireAdmin/getAdminGate check the
 * regular Admin Panel already uses, not a new auth concept.
 */
export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ active, breadcrumbs, adminName, adminEmail, children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <SuperAdminSidebar activeKey={active} adminName={adminName} />
      <SuperAdminMobileSidebar activeKey={active} adminName={adminName} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <SuperAdminTopbar breadcrumbs={breadcrumbs} adminName={adminName} adminEmail={adminEmail} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
