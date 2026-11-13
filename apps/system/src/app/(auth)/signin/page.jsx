'use client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { planNoticeFor, takeSigninNotice } from '@/utils/authErrors';
import { ShieldCheck, BarChart3, Sparkles } from 'lucide-react';
import SignInForm from './SignInForm';

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

        <div className="relative flex items-center gap-2 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-light.png"
            alt="Mizenzo"
            width={44}
            height={44}
            className="w-11 h-11 object-contain shrink-0"
          />
          <span className="text-xl font-bold tracking-tight">
            Mizenzo<span className="text-yellow-300"> School Management</span>
          </span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Mizenzo School Management system console
          </div>
          <h2 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
            Run the platform, <br /> not just a school.
          </h2>
          <p className="mt-4 text-teal-50/90 max-w-md">
            Organizations, packages, subscriptions and invoices for every tenant on Mizenzo School
            Management.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4">
              <ShieldCheck className="w-5 h-5 text-yellow-300" />
              <div className="mt-3 text-sm font-semibold">Secure by default</div>
              <div className="text-xs text-teal-50/80">Super-admin access only</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4">
              <BarChart3 className="w-5 h-5 text-yellow-300" />
              <div className="mt-3 text-sm font-semibold">Tenant-wide view</div>
              <div className="text-xs text-teal-50/80">Every school, one place</div>
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
          <div className="lg:hidden flex items-center gap-2 mb-10 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mizenzo"
              width={44}
              height={44}
              className="w-11 h-11 object-contain shrink-0"
            />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Mizenzo<span className="text-teal-600"> School Management</span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to the Mizenzo School Management system console.
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
