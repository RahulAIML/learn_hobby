'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SUPER_ADMIN_NAV } from '@/lib/superAdmin/navigation';

interface SidebarProps {
  activeKey: string;
  adminName: string;
}

export const SuperAdminBrand: React.FC = () => (
  <Link href="/super-admin" className="flex items-center gap-2.5 px-4 h-16 border-b border-slate-800 flex-shrink-0">
    <div className="w-8 h-8 rounded-md bg-red-700 flex items-center justify-center flex-shrink-0">
      <GraduationCap className="w-4 h-4 text-white" strokeWidth={2.25} />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-extrabold text-white tracking-tight leading-none font-heading">GURUKUL</p>
      <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest leading-none mt-0.5">Super Admin</p>
    </div>
  </Link>
);

export const SuperAdminNav: React.FC<{ activeKey: string }> = ({ activeKey }) => (
  <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
    {SUPER_ADMIN_NAV.map((group) => (
      <div key={group.label}>
        <p className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{group.label}</p>
        <ul className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors relative ${
                    isActive ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 font-medium'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-red-500" aria-hidden="true" />}
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

export const SuperAdminFooter: React.FC<{ adminName: string }> = ({ adminName }) => {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/');
    router.refresh();
  };
  const initials = adminName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="border-t border-slate-800 p-3 flex-shrink-0">
      <div className="flex items-center gap-2.5 px-1.5 py-2">
        <div className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{adminName}</p>
          <p className="text-[10px] text-slate-500">Super Administrator</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/** Persistent desktop/tablet sidebar. Hidden below `lg`; see SuperAdminMobileSidebar for the small-screen drawer. */
export const SuperAdminSidebar: React.FC<SidebarProps> = ({ activeKey, adminName }) => (
  <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 border-r border-slate-800 bg-slate-900 h-screen sticky top-0">
    <SuperAdminBrand />
    <SuperAdminNav activeKey={activeKey} />
    <SuperAdminFooter adminName={adminName} />
  </aside>
);
