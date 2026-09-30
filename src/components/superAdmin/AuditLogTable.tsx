'use client';

import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { ActivityEntry } from '@/lib/superAdmin/realData';

export const AuditLogTable: React.FC = () => {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/activity?limit=50')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load activity.');
        setEntries(body.data.activity);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: entries ?? [],
    searchFields: (l) => [l.actor, l.action, l.module],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="Real, timestamped platform events — submissions, enrollments, and publishes. No dedicated audit_log table exists yet, so this surfaces genuine derived events rather than a fabricated admin-action log." />

      {error && <p className="text-sm text-red-700">{error}</p>}

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by user, action, or module…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!entries ? (
          <LoadingState />
        ) : entries.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity recorded yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(l) => l.id}
              emptyLabel="No log entries match your search."
              columns={[
                { key: 'timestamp', header: 'Timestamp', render: (l) => <span className="text-slate-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span> },
                { key: 'actor', header: 'Actor', render: (l) => <p className="font-semibold text-slate-900">{l.actor}</p> },
                { key: 'action', header: 'Action', render: (l) => l.action },
                { key: 'module', header: 'Module', render: (l) => <span className="text-slate-400">{l.module}</span> },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};
