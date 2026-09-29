'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ChevronRight } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationButton } from './NotificationButton';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  breadcrumbs: Breadcrumb[];
  onOpenMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ breadcrumbs, onOpenMobileNav }) => (
  <header className="sticky top-0 z-30 h-16 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
    <div className="flex items-center gap-3 min-w-0">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="lg:hidden w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>
      <nav aria-label="Breadcrumb" className="min-w-0 hidden sm:block">
        <ol className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5 min-w-0">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className="text-slate-500 hover:text-slate-900 transition-colors truncate">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`truncate ${isLast ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>{crumb.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
      <NotificationButton />
      <div className="w-px h-6 bg-slate-200 mx-0.5 hidden sm:block" />
      <UserMenu />
    </div>
  </header>
);
