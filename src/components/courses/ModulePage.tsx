'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Download, Eye, Loader2, AlertCircle, ArrowRight, ClipboardList, Timer } from 'lucide-react';
import { formatBytes } from '@/lib/assessment/fileValidation';
import type { CourseDocumentSummary } from '@/lib/courseDocuments/types';

interface CbtAssessmentSummary {
  id: string;
  title: string;
  topic: string;
  timeLimitMinutes: number;
  attempts: { count: number; lastPercentage: number | null; bestPercentage: number | null } | null;
}

interface ModulePageProps {
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
  assessmentId: string | null;
  cbtAssessments?: CbtAssessmentSummary[];
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; documents: CourseDocumentSummary[] };

export const ModulePage: React.FC<ModulePageProps> = ({
  courseSlug,
  moduleId,
  moduleTitle,
  assessmentId,
  cbtAssessments = [],
}) => {
  const [state, setState] = useState<ListState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/courses/${courseSlug}/documents`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load documents.');
        if (!cancelled) {
          const filtered = (body.documents as CourseDocumentSummary[]).filter((d) => d.moduleId === moduleId);
          setState({ status: 'loaded', documents: filtered });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: 'error', message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug, moduleId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">{moduleTitle}</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight mt-1.5">
          Module Documents
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mt-2">
          Study the materials below, then take the module assessment.
        </p>
      </div>

      {state.status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading documents…</span>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{state.message}</p>
        </div>
      )}

      {state.status === 'loaded' && state.documents.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No documents have been added to this module yet.</p>
        </div>
      )}

      {state.status === 'loaded' && state.documents.length > 0 && (
        <ul className="space-y-3">
          {state.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500">
                    {doc.filename} &middot; {formatBytes(doc.sizeBytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/api/courses/${courseSlug}/documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View</span>
                </a>
                <a
                  href={`/api/courses/${courseSlug}/documents/${doc.id}?download=1`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cbtAssessments.length > 0 && (
        <div className="mt-8 space-y-3">
          {cbtAssessments.length > 1 && (
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              CBT Assessments ({cbtAssessments.length})
            </h2>
          )}
          {cbtAssessments.map((cbt) => {
            const taken = !!cbt.attempts;
            return (
              <div
                key={cbt.id}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6"
              >
                <div>
                  <p className="text-sm font-bold text-white">{cbt.title}</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {cbt.topic} &middot; {cbt.timeLimitMinutes} min &middot; live timer, instant scoring
                  </p>
                  {taken && (
                    <p className="text-xs text-emerald-400 font-semibold mt-1.5">
                      {cbt.attempts!.count} attempt{cbt.attempts!.count === 1 ? '' : 's'} &middot; Last: {cbt.attempts!.lastPercentage ?? '—'}%
                      &middot; Best: {cbt.attempts!.bestPercentage ?? '—'}%
                    </p>
                  )}
                </div>
                <Link
                  href={`/cbt/${cbt.id}`}
                  className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-lg transition-all duration-200"
                >
                  <Timer className="w-4 h-4" />
                  <span>{taken ? 'Retake CBT Assessment' : 'Start CBT Assessment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {assessmentId && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-5 sm:p-6">
          <div>
            <p className="text-sm font-bold text-slate-900">Ready to check your understanding?</p>
            <p className="text-xs text-slate-600 mt-0.5">Complete the module assessment and get instant AI feedback.</p>
          </div>
          <Link
            href={`/assessments/${assessmentId}`}
            className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all duration-200"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Take the Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
