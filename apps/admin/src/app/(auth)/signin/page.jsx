'use client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { planNoticeFor, takeSigninNotice } from '@/utils/authErrors';
import Link from 'next/link';
import { ShieldCheck, BarChart3, Sparkles } from 'lucide-react';
import SignInForm from './SignInForm';

const STUDENT_PORTAL_URL = process.env.NEXT_PUBLIC_STUDENT_URL || 'http://localhost:3001/signin';

// A forced sign-out can leave a reason for this page (?reason=…). Only known
// keys are shown; the plan refusal carries the server's own message.
function useSigninReason() {
  useEffect(() => {
    let reason = null;
    try {
      reason = new URLSearchParams(window.location.search).get('reason');
    } catch {
      reason = null;
    }
    if (!reason) return;
    const message = planNoticeFor(reason, takeSigninNotice());
    if (message) toast.error(message, { id: `signin-reason-${reason}`, duration: 10000 });
    window.history.replaceState(null, '', '/signin');
  }, []);
}

const SignInPage = () => {
  useSigninReason();
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a]">
      {/* ─── Left brand panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />

        <Link href="/" className="relative flex items-center gap-2 w-fit">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-0.5 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Mizenzo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Mizenzo<span className="text-yellow-300"> School Management</span>
          </span>
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            School management, simplified
          </div>
          <h2 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Run your school <br /> from one place.
          </h2>
          <p className="mt-4 text-teal-50/90 max-w-md">
            Admissions, attendance, fees, exams and reports — in one fast, modern workspace.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4">
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
              <div className="mt-3 text-sm font-semibold">Secure by default</div>
              <div className="text-xs text-teal-50/80">Role-based access control</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4">
              <BarChart3 className="w-5 h-5 text-yellow-300" />
              <div className="mt-3 text-sm font-semibold">Real-time reports</div>
              <div className="text-xs text-teal-50/80">Decisions backed by data</div>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-teal-50/70">
          © {new Date().getFullYear()} Mizenzo School Management. All rights reserved.
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md p-0.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Mizenzo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Mizenzo<span className="text-teal-600"> School Management</span>
            </span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Staff sign in
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              For school staff — admins, teachers, accountants and any custom role.
            </p>
            {/* Each audience has its own portal and its own login endpoint, and a
                wrong-portal attempt is answered with the same generic error as a
                bad password (deliberately — it must not confirm the account
                exists). So point students at theirs up front, statically. */}
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Are you a student?{' '}
              <a
                href={STUDENT_PORTAL_URL}
                className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                Sign in to the student portal
              </a>
            </p>
          </div>

          <div className="mt-8">
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
