'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { Topbar, type Breadcrumb } from './Topbar';

interface AdminLayoutProps {
  /** Key from src/lib/admin/navigation.ts identifying the active sidebar item. */
  active: string;
  breadcrumbs: Breadcrumb[];
  children: React.ReactNode;
}

/**
 * Shared shell for every /admin/* page: persistent sidebar (drawer on
 * mobile), topbar with breadcrumb/notifications/user menu, and a
 * content well. A page is responsible for its own auth gate — this layout
 * only renders once a page has already decided the viewer is an authorized
 * admin, so it never needs to know about session/auth logic itself.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ active, breadcrumbs, children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeKey={active} />
      <MobileSidebar activeKey={active} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar breadcrumbs={breadcrumbs} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
