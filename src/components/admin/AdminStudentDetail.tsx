'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, Trophy, Target, ListChecks, ArrowRight, Clock3 } from 'lucide-react';
import { findGoalSubcategory } from '@/lib/profile/goalTaxonomy';

interface StudentDetail {
  profile: {
    id: string;
    name: string;
    email: string;
    mobile: string | null;
    age: number | null;
    goalCategory: string | null;
    goalSubcategory: string | null;
    goalOption: string | null;
  };
  performance: {
    totalAttempts: number;
    completedAttempts: number;
    averagePercentage: number | null;
    bestPercentage: number | null;
    topicPerformance: { topic: string; percentage: number }[];
  };
  attempts: {
    attemptId: string;
    title: string;
    topic: string;
    status: string;
    percentage: number | null;
    submittedAt: string | null;
  }[];
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const AdminStudentDetail: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/students/${studentId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load student.');
        setData(body);
      })
      .catch((err: Error) => setError(err.message));
  }, [studentId]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-sm text-red-900">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const { profile, performance, attempts } = data;
  const goalLabel = profile.goalCategory && profile.goalSubcategory && profile.goalOption
    ? findGoalSubcategory(profile.goalCategory, profile.goalSubcategory)?.options.find((o) => o.value === profile.goalOption)?.label
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-700 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Students
      </Link>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">{profile.name}</h1>
      <p className="text-sm text-slate-500 mt-1">
        {profile.email} {profile.mobile ? `· ${profile.mobile}` : ''} {profile.age ? `· Age ${profile.age}` : ''}
      </p>
      {goalLabel && <p className="text-xs text-slate-400 mt-1">Goal: {goalLabel}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <ListChecks className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-xl font-black text-slate-900">{performance.totalAttempts}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Attempts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Target className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-xl font-black text-slate-900">{performance.averagePercentage ?? '—'}{performance.averagePercentage !== null && '%'}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <Trophy className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-xl font-black text-slate-900">{performance.bestPercentage ?? '—'}{performance.bestPercentage !== null && '%'}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Best</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <ListChecks className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-xl font-black text-slate-900">{performance.completedAttempts}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</p>
        </div>
      </div>

      {performance.topicPerformance.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Topic Performance</h2>
          <div className="space-y-2.5">
            {performance.topicPerformance.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 w-40 flex-shrink-0 truncate">{t.topic}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${t.percentage}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600 w-10 text-right">{t.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-10 mb-4">Assessment History ({attempts.length})</h2>
      {attempts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No CBT attempts yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li key={a.attemptId}>
              <Link
                href={`/cbt/results/${a.attemptId}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock3 className="w-3 h-3" />
                    {formatDate(a.submittedAt)}
                    {a.status === 'expired' && <span className="text-amber-600 font-semibold">(auto-submitted)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-lg font-black text-slate-900">{a.percentage ?? '—'}{a.percentage !== null && '%'}</span>
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
