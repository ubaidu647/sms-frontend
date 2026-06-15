'use client';
import { AlertTriangle, Lock } from 'lucide-react';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { isBlockedState } from '@/utils/subscriptionState';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';

// Wraps the dashboard. During the grace period it floats a persistent warning on
// every page; once the grace period ends (expired/cancelled/none) it covers the
// whole app with a non-dismissable block. Active subscriptions render nothing.
export default function SubscriptionGuard({ children }) {
  const { state, endDate, hardBlockAt } = useSubscriptionGuard();
  const blocked = isBlockedState(state);

  return (
    <>
      {children}

      {state === 'grace' && (
        <div
          role="status"
          className="fixed top-0 left-0 z-[60] w-full overflow-hidden border-b border-red-300 bg-red-50 shadow-md dark:border-red-800 dark:bg-red-950/95"
        >
          {/* Single, static copy for screen readers */}
          <span className="sr-only">
            Your subscription expired on {fmtDate(endDate)} and is in a grace period. Renew before{' '}
            {fmtDate(hardBlockAt)} or access will be blocked. Please contact your administrator to
            renew.
          </span>
          {/* Visual marquee: two identical copies scrolling -50% for a seamless loop.
              inline-flex (not a flex child) so the track keeps its full content
              width and actually overflows the bar — that overflow is what scrolls. */}
          <div
            aria-hidden="true"
            className="inline-flex w-max animate-marquee py-2 whitespace-nowrap hover:[animation-play-state:paused]"
          >
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0 items-center">
                {Array.from({ length: 2 }).map((_, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-2 px-8 text-sm font-semibold text-red-600 dark:text-red-400"
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                    Your subscription expired on {fmtDate(endDate)} and is in a grace period. Renew
                    before {fmtDate(hardBlockAt)} or access will be blocked. Please contact your
                    administrator to renew.
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {blocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <Lock className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {state === 'cancelled' ? 'Subscription cancelled' : 'Subscription expired'}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {state === 'cancelled'
                ? 'Your school’s subscription was cancelled.'
                : state === 'none'
                  ? 'Your school has no active subscription.'
                  : `Your grace period ended on ${fmtDate(hardBlockAt)}.`}{' '}
              Please contact your administrator to renew and restore access.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
