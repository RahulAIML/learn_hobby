import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SignupForm } from '@/components/auth/SignupForm';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const metadata = {
  title: 'Sign Up | Gurukul',
  description: 'Create your Gurukul account to start your learning journey.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-heading">Create Your Account</h1>
            <p className="text-sm text-slate-500 mt-1.5">Start your learning journey with Gurukul.</p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-red-700 hover:text-red-800">
              Sign in
            </Link>
          </p>

          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-700 transition-colors"
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
