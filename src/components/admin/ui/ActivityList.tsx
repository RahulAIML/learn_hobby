import React from 'react';
import type { MockActivityItem } from '@/lib/admin/mockDashboardData';

export const ActivityList: React.FC<{ items: MockActivityItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 py-6 text-center">No recent activity.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700 leading-snug">
              <span className="font-semibold text-slate-900">{item.actor}</span> {item.action}{' '}
              <span className="font-medium text-slate-900">{item.target}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.timestamp}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
