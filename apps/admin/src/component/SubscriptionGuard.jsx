'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Lock } from 'lucide-react';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useUserStore } from '@/store/userStore';
import { ACTIONS } from '@/constants/rolePermissions';
import { canSee } from '@/utils/permissions';
import { BILLING_PATH, paymentDueSoon, showsBlockOverlay } from '@/utils/subscriptionState';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '';

const TONES = {
  red: {
    bar: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/95',
    text: 'text-red-600 dark:text-red-400',
  },
  amber: {
    bar: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/95',
    text: 'text-amber-700 dark:text-amber-400',
  },
};

// A persistent warning floated across the top of every page.
function MarqueeBanner({ message, tone }) {
  const c = TONES[tone];
  return (
    <div
      role="status"
      className={`fixed top-0 left-0 z-[60] w-full overflow-hidden border-b shadow-md ${c.bar}`}
    >
      {/* Single, static copy for screen readers */}
      <span className="sr-only">{message}</span>
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
                className={`flex items-center gap-2 px-8 text-sm font-semibold ${c.text}`}
              >
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${c.text}`} />
                {message}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// Wraps the dashboard. During the grace period it floats a persistent warning on
// every page, and likewise in the last days before an unpaid invoice falls due.
// Once access ends (expired / unpaid / cancelled / none) it covers the app with
// a non-dismissable block, except the Billing screen, so the school can read
// its unpaid invoice. Active subscriptions render nothing.
export default function SubscriptionGuard({ children }) {
  const t = useTranslations('subscriptionGuard');
  const guard = useSubscriptionGuard();
  const { state, endDate, hardBlockAt, paymentDueAt } = guard;
  const pathname = usePathname();
  const role = useUserStore((s) => s.user?.role);
  const canViewBilling = canSee(role, ACTIONS.VIEW_BILLING);
  const blocked = showsBlockOverlay({ state, pathname, canViewBilling });
  const dueSoon = paymentDueSoon(guard);

  const blockTitle =
    state === 'cancelled'
      ? t('cancelledTitle')
      : state === 'unpaid'
        ? t('unpaidTitle')
        : t('expiredTitle');
  let blockBody;
  if (state === 'cancelled') blockBody = t('cancelledBody');
  else if (state === 'none') blockBody = t('noneBody');
  else if (state === 'unpaid') {
    blockBody = paymentDueAt
      ? t('unpaidBody', { date: fmtDate(paymentDueAt) })
      : t('unpaidBodyNoDate');
  } else blockBody = t('expiredBody', { date: fmtDate(hardBlockAt) });

  return (
    <>
      {children}

      {/* One bar at a time: the grace warning wins over an invoice falling due. */}
      {state === 'grace' ? (
        <MarqueeBanner
          tone="red"
          message={t('graceBanner', {
            endDate: fmtDate(endDate),
            hardBlockAt: fmtDate(hardBlockAt),
          })}
        />
      ) : dueSoon ? (
        <MarqueeBanner
          tone="amber"
          message={`${t('dueSoonBanner', { date: fmtDate(dueSoon) })} ${t('dueSoonHint')}`}
        />
      ) : null}

      {blocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <Lock className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{blockTitle}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {blockBody} {state === 'unpaid' ? t('payHint') : t('renewHint')}
            </p>
            {canViewBilling && (
              <Link
                href={BILLING_PATH}
                className="mt-5 inline-block rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                {t('viewBilling')}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
