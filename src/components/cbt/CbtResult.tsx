'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, MinusCircle, Clock3, Award, AlertCircle } from 'lucide-react';

interface ResultQuestion {
  id: string;
  type: 'mcq' | 'fill_blank';
  questionText: string;
  options: { id: string; optionText: string; orderIndex: number }[];
  correctAnswer: string;
  acceptableAnswers: string[];
  explanation: string;
  orderIndex: number;
  studentAnswer: string | null;
  isCorrect: boolean;
}

interface ResultData {
  attempt: {
    id: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    timeTakenSeconds: number | null;
    status: string;
  };
  assessment: { title: string; topic: string };
  questions: ResultQuestion[];
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const CbtResult: React.FC<{ attemptId: string }> = ({ attemptId }) => {
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cbt-attempts/${attemptId}/result`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not load result.');
        setData(body);
      })
      .catch((err: Error) => setError(err.message));
  }, [attemptId]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-sm text-red-900">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-slate-400 text-sm">Loading result…</div>;
  }

  const { attempt, assessment, questions } = data;
  const correct = questions.filter((q) => q.isCorrect).length;
  const incorrect = questions.filter((q) => q.studentAnswer && !q.isCorrect).length;
  const unanswered = questions.filter((q) => !q.studentAnswer).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <Award className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Assessment Complete</p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 font-heading mt-1.5">
          {attempt.score} / {attempt.maxScore}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{attempt.percentage}%</p>
        <p className="text-xs text-slate-400 mt-3">
          {assessment.title} &middot; {assessment.topic}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="rounded-xl bg-green-50 border border-green-100 p-3">
            <p className="text-xl font-black text-green-700">{correct}</p>
            <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Correct</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-100 p-3">
            <p className="text-xl font-black text-red-700">{incorrect}</p>
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Incorrect</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-xl font-black text-slate-600">{unanswered}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unanswered</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-slate-500">
          <Clock3 className="w-3.5 h-3.5" />
          Time Taken: {formatDuration(attempt.timeTakenSeconds)}
          {attempt.status === 'expired' && <span className="text-amber-600 font-semibold ml-1">(auto-submitted at time limit)</span>}
        </div>
      </div>

      <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-10 mb-4">Question Review</h2>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const answered = !!q.studentAnswer;
          return (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">Question {i + 1}</p>
                {q.isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                    <CheckCircle2 className="w-4 h-4" /> Correct
                  </span>
                ) : answered ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                    <MinusCircle className="w-4 h-4" /> Unanswered
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 mt-2">{q.questionText}</p>

              <div className="mt-3 space-y-1 text-sm">
                <p className="text-slate-600">
                  <span className="font-bold text-slate-500">Your answer: </span>
                  {q.studentAnswer || <span className="italic text-slate-400">No answer</span>}
                </p>
                {!q.isCorrect && (
                  <p className="text-green-700">
                    <span className="font-bold">Correct answer: </span>
                    {q.correctAnswer}
                  </p>
                )}
              </div>

              {q.explanation && (
                <p className="text-xs text-slate-500 mt-3 bg-slate-50 rounded-lg p-3">
                  <span className="font-bold text-slate-600">Explanation: </span>
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/courses/data-science/documents"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-700 transition-colors"
        >
          Back to Course
        </Link>
      </div>
    </div>
  );
};
