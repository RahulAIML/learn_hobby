'use client';

import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { ModuleOverviewRow } from '@/lib/superAdmin/realData';

export const ModuleOverviewTable: React.FC = () => {
  const [modules, setModules] = useState<ModuleOverviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/modules')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load modules.');
        setModules(body.data.modules);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const { query, setQuery, paged } = useTableControls({ rows: modules ?? [], searchFields: (m) => [m.title, m.courseTitle], pageSize: 20 });

  return (
    <div className="space-y-6">
      <PageHeader title="Modules" description="Every module across every course." />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by module or course…" />
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!modules ? (
          <LoadingState />
        ) : modules.length === 0 ? (
          <EmptyState icon={Layers} title="No modules yet." />
        ) : (
          <DataTable
            rows={paged}
            rowKey={(m) => m.id}
            emptyLabel="No modules match your search."
            columns={[
              { key: 'title', header: 'Module', render: (m) => <p className="font-semibold text-slate-900">{m.title}</p> },
              { key: 'courseTitle', header: 'Course', render: (m) => <span className="text-slate-400">{m.courseTitle}</span> },
              { key: 'documentCount', header: 'Documents', align: 'right', render: (m) => m.documentCount },
              { key: 'assessmentCount', header: 'Assessments', align: 'right', render: (m) => m.assessmentCount },
            ]}
          />
        )}
      </div>
    </div>
  );
};
