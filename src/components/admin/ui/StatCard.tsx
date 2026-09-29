import React from 'react';
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
}

const DELTA_STYLES: Record<'up' | 'down' | 'flat', { icon: LucideIcon; className: string }> = {
  up: { icon: ArrowUp, className: 'text-emerald-700 bg-emerald-50' },
  down: { icon: ArrowDown, className: 'text-red-700 bg-red-50' },
  flat: { icon: Minus, className: 'text-slate-500 bg-slate-100' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, delta }) => {
  const deltaStyle = delta ? DELTA_STYLES[delta.direction] : null;
  const DeltaIcon = deltaStyle?.icon;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-500" strokeWidth={2} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 font-heading tracking-tight mt-3">{value}</p>
      {delta && deltaStyle && DeltaIcon && (
        <div className={`inline-flex items-center gap-1 mt-2.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${deltaStyle.className}`}>
          <DeltaIcon className="w-3 h-3" strokeWidth={2.5} />
          <span>{delta.value}</span>
        </div>
      )}
    </div>
  );
};
