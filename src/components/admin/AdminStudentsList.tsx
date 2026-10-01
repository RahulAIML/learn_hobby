'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Users, ArrowRight, Search, CircleDollarSign } from 'lucide-react';
import { findGoalCategory } from '@/lib/profile/goalTaxonomy';

interface StudentSummary {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  age: number | null;
  goalCategory: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  isPaid: boolean;
  totalAttempts: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
  latestPercentage: number | null;
}

function shortDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

type PlanFilter = 'all' | 'paid' | 'free';

export const AdminStudentsList: React.FC = () => {
  const [students, setStudents] = useState<StudentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');

  useEffect(() => {
    fetch('/api/admin/students')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load students.');
        setStudents(body.students);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!students) return null;
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchesPlan = planFilter === 'all' || (planFilter === 'paid' ? s.isPaid : !s.isPaid);
      return matchesQuery && matchesPlan;
    });
  }, [students, query, planFilter]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Users className="w-4 h-4 text-red-600" />
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Admin</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 font-heading tracking-tight">Students</h1>
      <p className="text-sm text-slate-500 mt-2">Every registered student and their CBT performance.</p>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {students && students.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-6">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(['all', 'paid', 'free'] as PlanFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setPlanFilter(f)}
                className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors capitalize ${
                  planFilter === f ? 'bg-red-50 text-red-800 border-red-200' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {!students ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-8 text-center mt-6">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No students registered yet.</p>
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-8 text-center mt-4">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No students match your search.</p>
        </div>
      ) : (
        <ul className="space-y-2 mt-4">
          {filtered!.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/students/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-red-300 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                    {s.isPaid && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 flex-shrink-0">
                        <CircleDollarSign className="w-2.5 h-2.5" />
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {s.email}{s.mobile ? ` · ${s.mobile}` : ''}{s.age ? ` · Age ${s.age}` : ''}{s.goalCategory ? ` · ${findGoalCategory(s.goalCategory)?.label ?? s.goalCategory}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Joined {shortDate(s.createdAt)}{s.lastLoginAt ? ` · Active ${shortDate(s.lastLoginAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{s.totalAttempts}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Attempts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {s.averagePercentage ?? '—'}
                      {s.averagePercentage !== null && '%'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
