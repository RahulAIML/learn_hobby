import React from 'react';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  operational: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  disabled: 'bg-slate-100 text-slate-500 border-slate-200',
  archived: 'bg-slate-100 text-slate-400 border-slate-200',
  degraded: 'bg-amber-50 text-amber-700 border-amber-100',
  generating: 'bg-amber-50 text-amber-700 border-amber-100',
  suspended: 'bg-red-50 text-red-700 border-red-100',
  down: 'bg-red-50 text-red-700 border-red-100',
  failed: 'bg-red-50 text-red-700 border-red-100',
};

/** Generic status pill — color derived from the status string itself (lowercased), consistent across every Super Admin table. */
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = STATUS_STYLES[status.toLowerCase()] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  return <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border capitalize whitespace-nowrap ${style}`}>{status}</span>;
};
