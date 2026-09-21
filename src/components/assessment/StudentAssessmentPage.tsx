'use client';

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, ClipboardList, ArrowLeft, History } from 'lucide-react';
import { FileUploader } from './FileUploader';
import { FilePreview } from './FilePreview';
import { EvaluateButton } from './EvaluateButton';
import { EvaluationLoading } from './EvaluationLoading';
import { EvaluationResult } from './EvaluationResult';
import { assessmentReducer, initialAssessmentState } from './assessmentState';
import type { EvaluationResult as EvaluationResultType } from '@/lib/assessment/schema';

interface AssessmentInfo {
  id: string;
  title: string;
  instructions: string;
  maxScore: number;
  allowedFormats: string[];
  courseSlug: string;
}

interface HistoryItem {
  id: string;
  submittedAt: string;
  status: string;
  evaluation: EvaluationResultType | null;
}

interface StudentAssessmentPageProps {
  assessment: AssessmentInfo;
}

export const StudentAssessmentPage: React.FC<StudentAssessmentPageProps> = ({ assessment }) => {
  const [state, dispatch] = useReducer(assessmentReducer, initialAssessmentState);
  const inFlightRef = useRef(false);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);

  const isBusy = state.status === 'uploading' || state.status === 'evaluating';

  const loadHistory = useCallback(() => {
    fetch(`/api/assessments/${assessment.id}/submissions`)
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setHistory(body.submissions);
      })
      .catch(() => {});
  }, [assessment.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = useCallback(async () => {
    if (inFlightRef.current || !state.file) return;
    inFlightRef.current = true;

    dispatch({ type: 'SUBMIT_START' });

    try {
      const formData = new FormData();
      formData.append('file', state.file);

      dispatch({ type: 'SUBMIT_EVALUATING' });

      const res = await fetch(`/api/assessments/${assessment.id}/submissions`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        dispatch({ type: 'SUBMIT_ERROR', message: data?.error?.message ?? 'Something went wrong. Please try again.' });
        return;
      }

      dispatch({ type: 'SUBMIT_SUCCESS', result: data.evaluation });
      loadHistory();
    } catch {
      dispatch({
        type: 'SUBMIT_ERROR',
        message: 'Could not reach the server. Please check your connection and try again.',
      });
    } finally {
      inFlightRef.current = false;
    }
  }, [state.file, assessment.id, loadHistory]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href={`/courses/${assessment.courseSlug}/documents`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Course
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <ClipboardList className="w-4 h-4 text-red-600" />
          <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">{assessment.title}</h1>
      </div>

      {state.status === 'success' && state.result ? (
        <EvaluationResult result={state.result} onEvaluateAnother={() => dispatch({ type: 'RESET' })} />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-card">
          <section className="mb-8">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Instructions</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{assessment.instructions}</p>
            <p className="text-xs text-slate-400 mt-3">
              Maximum score: {assessment.maxScore} &middot; Accepted formats: {assessment.allowedFormats.join(', ')}
            </p>
          </section>

          <section aria-labelledby="upload-heading" className="mb-8">
            <h2 id="upload-heading" className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
              Upload Your Completed Assessment
            </h2>

            {state.file ? (
              <FilePreview file={state.file} disabled={isBusy} onRemove={() => dispatch({ type: 'SET_FILE', file: null })} />
            ) : (
              <FileUploader
                disabled={isBusy}
                onFileAccepted={(file) => dispatch({ type: 'SET_FILE', file })}
                onError={(message) => dispatch({ type: 'SUBMIT_ERROR', message })}
              />
            )}
          </section>

          {state.status === 'error' && state.errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-900 leading-relaxed">{state.errorMessage}</p>
                {state.file && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {isBusy ? (
            <EvaluationLoading />
          ) : (
            <div className="flex justify-center sm:justify-start">
              <EvaluateButton disabled={!state.file || isBusy} loading={isBusy} onClick={handleSubmit} />
            </div>
          )}
        </div>
      )}

      {history && history.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Previous Submissions</h2>
          </div>
          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <span className="text-xs text-slate-600">{new Date(item.submittedAt).toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-900">
                  {item.evaluation ? `${item.evaluation.overall_score} / ${item.evaluation.max_score}` : item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
