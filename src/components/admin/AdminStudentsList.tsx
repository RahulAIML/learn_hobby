'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { findGoalCategory } from '@/lib/profile/goalTaxonomy';

interface StudentSummary {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  age: number | null;
  goalCategory: string | null;
  totalAttempts: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
  latestPercentage: number | null;
}

export const AdminStudentsList: React.FC = () => {
  const [students, setStudents] = useState<StudentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/students')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load students.');
        setStudents(body.students);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-1.5">
        <Users className="w-4 h-4 text-red-600" />
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Admin</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">Students</h1>
      <p className="text-sm text-slate-500 mt-2">Every registered student and their CBT performance.</p>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {!students ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center mt-6">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No students registered yet.</p>
        </div>
      ) : (
        <ul className="space-y-2 mt-6">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/students/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {s.email} {s.age ? `· Age ${s.age}` : ''} {s.goalCategory ? `· ${findGoalCategory(s.goalCategory)?.label ?? s.goalCategory}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{s.totalAttempts}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Attempts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{s.averagePercentage ?? '—'}{s.averagePercentage !== null && '%'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Avg</p>
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
