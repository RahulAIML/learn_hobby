import React from 'react';
import { Construction } from 'lucide-react';

export const ComingSoon: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-10 sm:p-16 text-center">
    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
      <Construction className="w-5 h-5 text-slate-400" strokeWidth={2} />
    </div>
    <h1 className="text-lg font-bold text-slate-900 font-heading">{title}</h1>
    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">{description}</p>
  </div>
);
