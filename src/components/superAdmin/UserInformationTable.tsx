'use client';

import React, { useState } from 'react';
import { UserCog } from 'lucide-react';
import { PageHeader } from '@/components/superAdmin/ui/PageHeader';
import { FilterBar } from '@/components/superAdmin/ui/FilterBar';
import { StatusBadge } from '@/components/superAdmin/ui/StatusBadge';
import { EmptyState } from '@/components/superAdmin/ui/EmptyState';
import { Pagination } from '@/components/superAdmin/ui/Pagination';
import { DataTable } from '@/components/admin/ui/DataTable';
import { useTableControls } from '@/lib/superAdmin/useTableControls';
import { mockUsers } from '@/lib/superAdmin/mockData';

type StatusFilter = 'all' | 'Active' | 'Inactive' | 'Suspended';
type RoleFilter = 'all' | 'Student' | 'Admin' | 'Moderator';

export const UserInformationTable: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const filteredByFacet = mockUsers.filter((u) => (statusFilter === 'all' || u.status === statusFilter) && (roleFilter === 'all' || u.role === roleFilter));

  const { query, setQuery, page, setPage, pageCount, paged, totalItems, pageSize } = useTableControls({
    rows: filteredByFacet,
    searchFields: (u) => [u.name, u.username, u.email, u.mobile],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="User Information" description="Every registered account — students, admins, and moderators." />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by name, username, email, or mobile…"
        filters={[
          {
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as StatusFilter),
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Suspended', label: 'Suspended' },
            ],
          },
          {
            value: roleFilter,
            onChange: (v) => setRoleFilter(v as RoleFilter),
            options: [
              { value: 'all', label: 'All Roles' },
              { value: 'Student', label: 'Student' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Moderator', label: 'Moderator' },
            ],
          },
        ]}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        {mockUsers.length === 0 ? (
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
                { key: 'mobile', header: 'Mobile', render: (u) => <span className="text-slate-400">{u.mobile}</span> },
                { key: 'role', header: 'Role', render: (u) => u.role },
                { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
                { key: 'joined', header: 'Joined', render: (u) => <span className="text-slate-400">{u.joined}</span> },
                { key: 'lastActive', header: 'Last Active', align: 'right', render: (u) => <span className="text-slate-400">{u.lastActive}</span> },
              ]}
            />
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};
