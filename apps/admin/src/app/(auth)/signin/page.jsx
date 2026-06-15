'use client';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, BarChart3, Sparkles } from 'lucide-react';
import SignInForm from './SignInForm';

const SignInPage = () => {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a]">
      {/* ─── Left brand panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />

        <Link href="/" className="relative flex items-center gap-2 w-fit">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Node<span className="text-yellow-300">Campus</span>
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
          © {new Date().getFullYear()} Node Campus. All rights reserved.
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10 w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-600/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Node<span className="text-teal-600">Campus</span>
            </span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to continue to your dashboard.
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
