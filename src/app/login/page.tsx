import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LoginForm } from '@/components/auth/LoginForm';
import { ArrowLeft, LogIn } from 'lucide-react';

export const metadata = {
  title: 'Login | Gurukul',
  description: 'Sign in to your Gurukul account to continue your learning journey.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-heading">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to continue your learning journey.</p>
          </div>

          <LoginForm />

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
