'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// middleware.js has always redirected here for a role that may not reach a
// route, but the page itself was missing — so the redirect 404'd. Reachable
// now for, among others, a super-admin following an old /dashboard/system
// bookmark: those screens moved to the separate system console (@sms/system).
export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          You don&apos;t have access to this page
        </h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Your role doesn&apos;t include this area. If you were looking for organizations, packages
          or subscriptions, those moved to the system console.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            Back to dashboard
          </Link>
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-semibold transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
