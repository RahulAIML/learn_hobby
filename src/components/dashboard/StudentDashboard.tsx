'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Trophy, Target, ListChecks, ArrowRight, Clock3 } from 'lucide-react';
import { ProfileOnboarding } from '@/components/profile/ProfileOnboarding';

interface HistoryEntry {
  attemptId: string;
  assessmentId: string;
  title: string;
  topic: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  timeTakenSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
}

interface PerformanceSummary {
  totalAttempts: number;
  completedAttempts: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
  topicPerformance: { topic: string; percentage: number }[];
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const StudentDashboard: React.FC<{ profileComplete: boolean }> = ({ profileComplete: initialProfileComplete }) => {
  const [profileComplete, setProfileComplete] = useState(initialProfileComplete);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [perfRes, historyRes] = await Promise.all([fetch('/api/student/performance'), fetch('/api/student/assessments/history')]);
      const perfBody = await perfRes.json();
      const historyBody = await historyRes.json();
      if (!perfRes.ok || !perfBody.success) throw new Error(perfBody?.error?.message ?? 'Could not load performance.');
      if (!historyRes.ok || !historyBody.success) throw new Error(historyBody?.error?.message ?? 'Could not load history.');
      setPerformance(perfBody.performance);
      setHistory(historyBody.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
    }
  }, []);

  useEffect(() => {
    if (profileComplete) load();
  }, [profileComplete, load]);

  if (!profileComplete) {
    return <ProfileOnboarding onComplete={() => setProfileComplete(true)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">My Dashboard</h1>
      <p className="text-sm text-slate-500 mt-2">Your CBT performance across every assessment you&apos;ve taken.</p>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {!performance || !history ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <ListChecks className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xl font-black text-slate-900">{performance.totalAttempts}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Attempts</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <Target className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xl font-black text-slate-900">{performance.averagePercentage ?? '—'}{performance.averagePercentage !== null && '%'}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Score</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <Trophy className="w-4 h-4 text-amber-500 mb-2" />
              <p className="text-xl font-black text-slate-900">{performance.bestPercentage ?? '—'}{performance.bestPercentage !== null && '%'}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Best Score</p>
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

          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-10 mb-4">My Assessments</h2>
          {history.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
              <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">You haven&apos;t taken any CBT assessments yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((entry) => (
                <li key={entry.attemptId}>
                  <Link
                    href={`/cbt/results/${entry.attemptId}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-red-300 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{entry.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock3 className="w-3 h-3" />
                        {formatDate(entry.submittedAt)}
                        {entry.status === 'expired' && <span className="text-amber-600 font-semibold">(auto-submitted)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-lg font-black text-slate-900">{entry.percentage ?? '—'}{entry.percentage !== null && '%'}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 transition-colors" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
