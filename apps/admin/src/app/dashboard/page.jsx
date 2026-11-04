'use client';

import Link from 'next/link';
import { useQueries, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, ArrowRight, LayoutGrid } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { buildChecklist, visibleQuickLinks, visibleSteps } from '@/utils/gettingStarted';

// One light request per checklist step: limit 1 where only the total matters.
const SOURCES = {
  branchProfile: { url: '/branch-profile/me' },
  classes: { url: '/class/list', limit: 200 },
  subjects: { url: '/subject/list', limit: 1 },
  staff: { url: '/staff/list', limit: 1 },
  students: { url: '/student/list', limit: 1 },
  feeStructure: { url: '/fee/structure/list', limit: 1 },
  cashAccount: { url: '/ledger/mapping/cash-bank-status' },
};

export default function Dashboard() {
  const { user } = useUserStore();
  const { accessToken: token } = useTokenStore();
  const role = user?.role;

  const steps = visibleSteps(role);

  // School name for the greeting. Optional — a failure just leaves it out.
  const { data: schoolRes } = useQuery({
    queryKey: ['home', 'school'],
    queryFn: () => fetchData({ url: '/schools', page: 1, limit: 1, token }),
    enabled: !!token && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const schoolName =
    (Array.isArray(schoolRes?.data) ? schoolRes.data[0]?.name : '') ||
    user?.school?.name ||
    user?.schoolName ||
    '';

  // Only the steps this role may read are fetched; a 403 or any failure marks
  // the step 'error' and it is left off the list (never a crash).
  const queries = useQueries({
    queries: steps.map((s) => ({
      queryKey: ['home', 'checklist', s.key, user?._id || ''],
      queryFn: () =>
        fetchData({
          url: SOURCES[s.key].url,
          page: 1,
          limit: SOURCES[s.key].limit ?? 20,
          token,
        }),
      enabled: !!token && !!user,
      retry: false,
      staleTime: 60 * 1000,
    })),
  });

  const results = {};
  steps.forEach((s, i) => {
    const q = queries[i];
    if (!q || q.isError) results[s.key] = { status: 'error' };
    else if (q.isPending) results[s.key] = { status: 'loading' };
    else results[s.key] = { status: 'ok', value: q.data };
  });
  const rows = buildChecklist(role, results);
  const doneCount = rows.filter((r) => r.state === 'done').length;
  const settled = rows.filter((r) => r.state !== 'loading').length;
  const links = visibleQuickLinks(role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8">
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{schoolName || 'Welcome'}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here is what is left to set up, and shortcuts to the screens you use most.
          </p>
        </div>

        {rows.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Getting started</h2>
              {settled > 0 && (
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {doneCount} of {rows.length} done
                </span>
              )}
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => (
                <li key={r.key}>
                  <Link
                    href={r.href}
                    className="flex items-start gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 no-underline"
                  >
                    <span className="mt-0.5" aria-hidden="true">
                      {r.state === 'loading' && (
                        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                      )}
                      {r.state === 'done' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                      {r.state === 'pending' && <Circle className="w-5 h-5 text-amber-500" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm font-medium ${
                          r.state === 'done'
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {r.label}
                        <span className="sr-only">
                          {r.state === 'done' ? ' (done)' : r.state === 'pending' ? ' (to do)' : ''}
                        </span>
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {r.detail || r.hint}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard/school"
              className="flex items-center gap-2 bg-teal-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-teal-700 no-underline"
            >
              <LayoutGrid className="w-4 h-4" />
              School dashboard
            </Link>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 hover:border-teal-500 no-underline"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
