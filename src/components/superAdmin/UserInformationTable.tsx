'use client';

import React, { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { EmptyState, LoadingState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import type { UserInfoRow } from '@/lib/superAdmin/realData';

type RoleFilter = 'all' | 'student' | 'admin' | 'super_admin';

const ROLE_LABEL: Record<string, string> = { student: 'Student', admin: 'Admin', super_admin: 'Super Admin' };

export const UserInformationTable: React.FC = () => {
  const [users, setUsers] = useState<UserInfoRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  useEffect(() => {
    fetch('/api/super-admin/users')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load users.');
        setUsers(body.data.users);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredByFacet = (users ?? []).filter((u) => roleFilter === 'all' || u.role === roleFilter);

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: filteredByFacet,
    searchFields: (u) => [u.name, u.username, u.email, u.mobile ?? ''],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="User Information" description="Every registered account — students, admins, and super admins." />

      {error && <p className="text-sm text-red-700">{error}</p>}

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by name, username, email, or mobile…"
        filters={[
          {
            value: roleFilter,
            onChange: (v) => setRoleFilter(v as RoleFilter),
            options: [
              { value: 'all', label: 'All Roles' },
              { value: 'student', label: 'Student' },
              { value: 'admin', label: 'Admin' },
              { value: 'super_admin', label: 'Super Admin' },
            ],
          },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {!users ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState icon={UserCog} title="No users yet." />
        ) : (
          <>
            <DataTable
              rows={paged}
              rowKey={(u) => u.id}
              emptyLabel="No users match your search."
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (u) => (
                    <div>
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-400">@{u.username}</p>
                    </div>
                  ),
                },
                { key: 'email', header: 'Email', render: (u) => u.email },
                { key: 'mobile', header: 'Mobile', render: (u) => <span className="text-slate-400">{u.mobile ?? '—'}</span> },
                { key: 'role', header: 'Role', render: (u) => <StatusBadge status={ROLE_LABEL[u.role] ?? u.role} /> },
                { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span> },
                {
                  key: 'lastLoginAt',
                  header: 'Last Active',
                  align: 'right',
                  render: (u) => <span className="text-slate-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</span>,
                },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};
