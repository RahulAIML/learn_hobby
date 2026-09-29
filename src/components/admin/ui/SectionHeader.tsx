import React from 'react';
import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, action, children }) => {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {children}
        {action && (
          <Link href={action.href} className="text-xs font-semibold text-red-700 hover:text-red-800 transition-colors whitespace-nowrap">
            {action.label} →
          </Link>
        )}
      </div>
    </div>
  );
};
