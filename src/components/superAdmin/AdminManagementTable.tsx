'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { RowActionsMenu } from '@/components/superAdmin/ui/RowActionsMenu';
import { ConfirmationModal } from '@/components/superAdmin/ui/ConfirmationModal';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { AdminRow } from '@/lib/superAdmin/realData';

export const AdminManagementTable: React.FC = () => {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminRow | null>(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch('/api/super-admin/admins');
        if (!res.ok) throw new Error('Failed to load admins');
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Load failed');
        setAdmins(json.data.admins || json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: admins,
    searchFields: (a) => [a.name, a.username, a.email],
  });

  if (loading) return <LoadingState />;
  if (error) return <EmptyState icon={ShieldCheck} title="Failed to Load" description={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Management" description="Every admin and moderator account on the platform." />

      <FilterBar query={query} onQueryChange={setQuery} placeholder="Search by name, username, or email…" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {admins.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No admin accounts yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(a) => a.id}
              emptyLabel="No admins match your search."
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (a) => (
                    <div>
                      <p className="font-semibold text-slate-900">{a.name}</p>
                      <p className="text-[11px] text-slate-400">@{a.username}</p>
                    </div>
                  ),
                },
                { key: 'email', header: 'Email', render: (a) => a.email },
                { key: 'role', header: 'Role', render: (a) => <span className="text-sm font-medium text-slate-700">{a.role}</span> },
                { key: 'lastLogin', header: 'Last Login', render: (a) => <span className="text-slate-400">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}</span> },
                { key: 'createdAt', header: 'Created', render: (a) => <span className="text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span> },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (a) => (
                    <RowActionsMenu
                      actions={[
                        { label: 'View', onClick: () => {} },
                        { label: 'Edit', onClick: () => {} },
                        { label: 'Disable', onClick: () => setConfirmTarget(a), destructive: true },
                      ]}
                    />
                  ),
                },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmationModal
        open={!!confirmTarget}
        title={confirmTarget ? `Disable ${confirmTarget.name}?` : 'Disable Admin?'}
        description="Disabling an admin account is not yet implemented. This is a UI-only preview. No changes have been made."
        confirmLabel="Understand"
        destructive={false}
        onConfirm={() => setConfirmTarget(null)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
