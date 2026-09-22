import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { LogIn, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CbtPlayer } from '@/components/cbt/CbtPlayer';
import { getCbtAssessment } from '@/lib/cbt/store';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const assessment = await getCbtAssessment(params.id);
  return { title: assessment ? `${assessment.title} | Gurukul CBT` : 'Assessment | Gurukul' };
}

function GateMessage({ icon: Icon, title, message, showLogin }: { icon: typeof ShieldAlert; title: string; message: string; showLogin?: boolean }) {
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

export default async function CbtAssessmentPage({ params }: Props) {
  const assessment = await getCbtAssessment(params.id);
  if (!assessment || assessment.status !== 'published') notFound();

  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  if (!user) {
    return <GateMessage icon={LogIn} title="Sign In Required" message="Please sign in to take this assessment." showLogin />;
  }
  if (user.role === 'student' && !user.enrollments.includes(assessment.courseSlug)) {
    return <GateMessage icon={ShieldAlert} title="Not Enrolled" message="You are not enrolled in the course this assessment belongs to." />;
  }

  // Deliberately no Navbar/Footer here — a CBT exam should be focused and
  // distraction-free, not wrapped in marketing chrome, per the CBT spec.
  return <CbtPlayer assessmentId={assessment.id} title={assessment.title} />;
}
