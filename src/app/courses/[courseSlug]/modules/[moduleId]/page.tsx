import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { LogIn, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ModulePage } from '@/components/courses/ModulePage';
import { getCourse } from '@/data/courses';
import { getModule } from '@/lib/modules/store';
import { getAssessmentByModule } from '@/lib/assessments/store';
import { SESSION_COOKIE, getSessionUserFromCookieValue } from '@/lib/auth/session';
import { isEnrolled } from '@/lib/auth/store';

interface Props {
  params: { courseSlug: string; moduleId: string };
}

export function generateMetadata({ params }: Props) {
  const mod = getModule(params.courseSlug, params.moduleId);
  return { title: mod ? `${mod.title} | Gurukul` : 'Module | Gurukul' };
}

function GateMessage({ icon: Icon, title, message, showLogin }: { icon: typeof ShieldAlert; title: string; message: string; showLogin?: boolean }) {
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

export default function CourseModulePage({ params }: Props) {
  const course = getCourse(params.courseSlug);
  if (!course) notFound();
  const mod = getModule(params.courseSlug, params.moduleId);
  if (!mod) notFound();

  const token = cookies().get(SESSION_COOKIE)?.value;
  const user = getSessionUserFromCookieValue(token);

  let gate: React.ReactNode = null;
  if (!user) {
    gate = <GateMessage icon={LogIn} title="Sign In Required" message="Please sign in to access this module." showLogin />;
  } else if (user.role === 'student' && !isEnrolled(user.id, course.slug)) {
    gate = <GateMessage icon={ShieldAlert} title="Not Enrolled" message={`You are not enrolled in ${course.title}.`} />;
  }

  const assessment = getAssessmentByModule(mod.id);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1">
        {gate ?? (
          <ModulePage
            courseSlug={course.slug}
            moduleId={mod.id}
            moduleTitle={mod.title}
            assessmentId={assessment && assessment.status === 'active' ? assessment.id : null}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
