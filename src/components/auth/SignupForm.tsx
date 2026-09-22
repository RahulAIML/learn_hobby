'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, mobile: mobile || undefined }),
      });
      const createBody = await createRes.json();
      if (!createRes.ok || !createBody.success) {
        throw new Error(createBody?.error?.message ?? 'Could not create your account.');
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginBody = await loginRes.json();
      if (!loginRes.ok || !loginBody.success) {
        throw new Error('Account created — please sign in.');
      }

      router.push('/courses/data-science/documents');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; autoComplete?: string; required?: boolean } = {}
  ) => (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        placeholder={opts.placeholder}
        required={opts.required}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-400 transition-colors disabled:opacity-60"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field('name', 'Full Name', name, setName, { placeholder: 'Jane Student', autoComplete: 'name', required: true })}
      {field('username', 'Username', username, setUsername, {
        placeholder: 'jane_student',
        autoComplete: 'username',
        required: true,
      })}
      {field('email', 'Email Address', email, setEmail, {
        type: 'email',
        placeholder: 'you@example.com',
        autoComplete: 'email',
        required: true,
      })}
      {field('mobile', 'Mobile Number (optional)', mobile, setMobile, { type: 'tel', placeholder: '+1 555 000 1234', autoComplete: 'tel' })}
      {field('password', 'Password', password, setPassword, {
        type: 'password',
        placeholder: '••••••••',
        autoComplete: 'new-password',
        required: true,
      })}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-900">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name || !username || !email || !password}
        className="w-full py-3 rounded-xl text-sm font-bold text-white bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Create Account
      </button>
      <p className="text-center text-xs text-slate-400">
        You&apos;ll be enrolled in the Data Science Championship Program by default.
      </p>
    </form>
  );
};
