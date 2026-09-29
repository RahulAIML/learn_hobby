'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { MOCK_RECENT_ACTIVITY } from '@/lib/admin/mockDashboardData';

/** UI-only for now — badge and dropdown use the same placeholder activity feed as the dashboard, no real notification store yet. */
export const NotificationButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = MOCK_RECENT_ACTIVITY.slice(0, 4);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <Bell className="w-4 h-4" strokeWidth={2} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-600" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 w-72 rounded-md border border-slate-200 bg-white shadow-lg py-1.5 z-40">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900">Notifications</p>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="px-3 py-2.5 border-b border-slate-50 last:border-0">
                <p className="text-xs text-slate-700 leading-snug">
                  <span className="font-semibold text-slate-900">{item.actor}</span> {item.action}{' '}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.timestamp}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
