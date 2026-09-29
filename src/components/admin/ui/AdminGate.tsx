import React from 'react';
import Link from 'next/link';
import { LogIn, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import type { SessionUser } from '@/lib/auth/types';

function GateMessage({ icon: Icon, title, message, showLogin }: { icon: LucideIcon; title: string; message: string; showLogin?: boolean }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-black text-slate-900 font-heading">{title}</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{message}</p>
          {showLogin && (
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-red-700 hover:bg-red-800 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Shared admin-route gate: returns the plain-chrome gate screen (no sidebar
 * — an unauthenticated/unauthorized visitor never sees admin navigation) if
 * the session user isn't an authorized admin, or null if they are and the
 * page should render its real AdminLayout content. Auth logic itself
 * (session decoding) is untouched — this only centralizes the two gate
 * messages that were duplicated across every admin page.
 */
export function getAdminGate(user: SessionUser | null): React.ReactNode | null {
  if (!user) {
    return <GateMessage icon={LogIn} title="Sign In Required" message="Please sign in with an admin account to continue." showLogin />;
  }
  if (user.role !== 'admin') {
    return <GateMessage icon={ShieldAlert} title="Admin Access Required" message="Your account does not have admin access." />;
  }
  return null;
}
