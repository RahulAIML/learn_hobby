import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { LogIn } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';
import { getUserById } from '@/lib/auth/store';

export const metadata = {
  title: 'My Dashboard | Gurukul',
};

function GateMessage({ icon: Icon, title, message, showLogin }: { icon: typeof LogIn; title: string; message: string; showLogin?: boolean }) {
  return (
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
  );
}

export default async function DashboardPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const sessionUser = getSessionUserFromCookieValue(token);

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar variant="light" />
        <main className="flex-1">
          <GateMessage icon={LogIn} title="Sign In Required" message="Please sign in to view your dashboard." showLogin />
        </main>
        <Footer />
      </div>
    );
  }

  // Profile-completion state is read fresh from the DB rather than the
  // session JWT, so completing onboarding takes effect immediately without
  // needing to log out/in for a new token.
  const user = await getUserById(sessionUser.id);
  const profileComplete = !!(user?.age && user?.goalOption);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1">
        <StudentDashboard profileComplete={profileComplete} />
      </main>
      <Footer />
    </div>
  );
}
