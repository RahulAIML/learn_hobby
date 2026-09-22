'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertCircle, Users as UsersIcon, ShieldCheck, GraduationCap, CircleDollarSign } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  mobile: string | null;
  phoneNo: string | null;
  role: 'student' | 'admin';
  lastLoginAt: string | null;
  createdAt: string;
  isPaid: boolean;
}

export const AdminUsersList: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to load users.');
      setUsers(body.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const togglePaid = async (user: AdminUser) => {
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/paid`, { method: user.isPaid ? 'DELETE' : 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Failed to update paid status.');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update paid status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-1.5">
        <UsersIcon className="w-4 h-4 text-red-600" />
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Admin</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">Registered Users</h1>
      <p className="text-sm text-slate-500 mt-2">
        Every account stored in Postgres — updated live as people sign up and sign in.
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4">
        &quot;Paid&quot; is recorded manually by an admin — no payment gateway is integrated yet, so this does not
        reflect an automatic charge.
      </p>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {!users && !error && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {users && users.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center mt-6">
          <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No users yet.</p>
        </div>
      )}

      {users && users.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Last Sign-In</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">
                        @{u.username} &middot; {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100">
                          <CircleDollarSign className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.mobile || u.phoneNo || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => togglePaid(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.isPaid ? 'Unmark Paid' : 'Mark Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
