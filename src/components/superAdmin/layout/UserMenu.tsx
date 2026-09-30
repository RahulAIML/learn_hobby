'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User as UserIcon, Settings, ShieldCheck } from 'lucide-react';

interface UserMenuProps {
  name: string;
  email: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ name, email }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/');
    router.refresh();
  };

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials || <UserIcon className="w-4 h-4" />}
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <p className="text-xs font-semibold text-slate-900">{name}</p>
          <p className="text-[10px] text-slate-400">Super Administrator</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 w-60 rounded-md border border-slate-200 bg-white shadow-lg py-1.5 z-40">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
            <p className="text-[11px] text-slate-400 truncate">{email}</p>
          </div>
          <button type="button" role="menuitem" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <UserIcon className="w-3.5 h-3.5" />
            Profile
          </button>
          <button type="button" role="menuitem" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Settings className="w-3.5 h-3.5" />
            Account Settings
          </button>
          <button type="button" role="menuitem" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button type="button" role="menuitem" onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};
