'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { GOAL_TAXONOMY } from '@/lib/profile/goalTaxonomy';

interface ProfileOnboardingProps {
  onComplete: () => void;
}

export const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ onComplete }) => {
  const [age, setAge] = useState('');
  const [categoryValue, setCategoryValue] = useState('');
  const [subcategoryValue, setSubcategoryValue] = useState('');
  const [optionValue, setOptionValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const category = GOAL_TAXONOMY.find((c) => c.value === categoryValue);
  const subcategory = category?.subcategories.find((s) => s.value === subcategoryValue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ageNumber = Number(age);
    if (!Number.isInteger(ageNumber) || ageNumber < 10 || ageNumber > 100) {
      setError('Please enter a valid age between 10 and 100.');
      return;
    }
    if (!categoryValue || !subcategoryValue || !optionValue) {
      setError('Please select your goal.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: ageNumber,
          goalCategory: categoryValue,
          goalSubcategory: subcategoryValue,
          goalOption: optionValue,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Could not save your profile.');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="w-4 h-4 text-red-600" />
        <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider">One Last Step</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight">Tell us about yourself</h1>
      <p className="text-sm text-slate-500 mt-2">
        This helps us personalize your learning journey. You can update it later from your profile.
      </p>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Age</label>
          <input
            type="number"
            min={10}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 22"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">What is your goal?</label>
          <select
            value={categoryValue}
            onChange={(e) => {
              setCategoryValue(e.target.value);
              setSubcategoryValue('');
              setOptionValue('');
            }}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
          >
            <option value="">Select a category…</option>
            {GOAL_TAXONOMY.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {category && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{category.label} focus</label>
            <select
              value={subcategoryValue}
              onChange={(e) => {
                setSubcategoryValue(e.target.value);
                setOptionValue('');
              }}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
            >
              <option value="">Select…</option>
              {category.subcategories.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {subcategory && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Specifically</label>
            <div className="space-y-1.5">
              {subcategory.options.map((o) => (
                <label
                  key={o.value}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                    optionValue === o.value ? 'border-red-600 bg-red-50 text-red-800 font-semibold' : 'border-slate-200 text-slate-700 hover:border-red-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="goalOption"
                    value={o.value}
                    checked={optionValue === o.value}
                    onChange={() => setOptionValue(o.value)}
                    className="accent-red-600"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save & Continue
        </button>
      </form>
    </div>
  );
};
