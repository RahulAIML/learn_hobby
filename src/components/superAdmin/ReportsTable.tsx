'use client';

import React from 'react';
import { FileBarChart, Plus } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';

export const ReportsTable: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generated platform reports."
        action={
          <button
            type="button"
            disabled
            title="Report generation is not implemented yet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold bg-slate-200 text-slate-500 cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate Report
          </button>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <EmptyState icon={FileBarChart} title="No reports generated yet." description="Report generation is not built yet." />
      </div>
    </div>
  );
};
