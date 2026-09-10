'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Reached when a signed-in user without the super-admin role hits any /dashboard
// route. They have a valid session, just not for this console — so offer a way
// out (sign out) rather than a dead end.
export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          This console is super-admin only
        </h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Your account is signed in, but it does not have the super-admin role. School
          administration lives in the main admin app.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            Sign out
          </button>
          <Link
            href="/signin"
            className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-semibold transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
