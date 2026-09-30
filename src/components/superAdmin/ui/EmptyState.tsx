import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export const EmptyState: React.FC<{ icon: LucideIcon; title: string; description?: string }> = ({ icon: Icon, title, description }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-10 text-center">
    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
      <Icon className="w-4 h-4 text-slate-400" strokeWidth={2} />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {description && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
  </div>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);
