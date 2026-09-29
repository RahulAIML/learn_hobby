'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Clock } from 'lucide-react';
import { ADMIN_NAV } from '@/lib/admin/navigation';

interface SidebarProps {
  activeKey: string;
}

export const SidebarNav: React.FC<SidebarProps> = ({ activeKey }) => (
  <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
    {ADMIN_NAV.map((group, idx) => (
      <div key={group.label || `group-${idx}`}>
        {group.label && (
          <p className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.label}</p>
        )}
        <ul className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors relative ${
                    isActive
                      ? 'bg-red-50 text-red-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-red-600" aria-hidden="true" />}
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-red-700' : 'text-slate-400 group-hover:text-slate-600'}`}
                    strokeWidth={2}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.comingSoon && (
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      <Clock className="w-2.5 h-2.5" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

export const SidebarBrand: React.FC = () => (
  <Link href="/admin" className="flex items-center gap-2.5 px-4 h-16 border-b border-slate-200 flex-shrink-0">
    <div className="w-8 h-8 rounded-md bg-red-700 flex items-center justify-center flex-shrink-0">
      <GraduationCap className="w-4 h-4 text-white" strokeWidth={2.25} />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-extrabold text-slate-900 tracking-tight leading-none font-heading">GURUKUL</p>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Admin</p>
    </div>
  </Link>
);

/** Persistent desktop/tablet sidebar. Hidden below `lg`; see MobileSidebar for the small-screen drawer. */
export const Sidebar: React.FC<SidebarProps> = ({ activeKey }) => (
  <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
    <SidebarBrand />
    <SidebarNav activeKey={activeKey} />
  </aside>
);
