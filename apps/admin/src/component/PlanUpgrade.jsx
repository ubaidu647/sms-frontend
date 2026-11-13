'use client';
import Link from 'next/link';
import { Lock, CreditCard, House } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/component/Modal';
import { useUserStore } from '@/store/userStore';
import { canSee } from '@/utils/permissions';
import { ACTIONS } from '@/constants/rolePermissions';

// planFeatures.js keys → message keys (next-intl keys stay camelCase).
const MODULE_MESSAGE_KEY = {
  admissions: 'admissions',
  certificates: 'certificates',
  library: 'library',
  inventory: 'inventory',
  leave: 'leave',
  'staff-attendance': 'staffAttendance',
  'staff-salary': 'staffSalary',
  transport: 'transport',
  accounting: 'accounting',
  whatsapp: 'whatsapp',
};

/** Translated name of an add-on module (`t` from the 'planFeatures' namespace). */
export function moduleName(t, feature) {
  const key = MODULE_MESSAGE_KEY[feature];
  return key ? t(`modules.${key}`) : feature;
}

function useUpgradeCopy(feature) {
  const t = useTranslations('planFeatures');
  const role = useUserStore((s) => s.user?.role);
  const canViewBilling = canSee(role, ACTIONS.VIEW_BILLING);
  const headline = MODULE_MESSAGE_KEY[feature]
    ? t('moduleNotInPlan', { module: moduleName(t, feature) })
    : t('notInPlan');
  return {
    t,
    canViewBilling,
    headline,
    hint: canViewBilling ? t('upgradeHint') : t('contactAdmin'),
  };
}

/**
 * Shown when someone clicks a locked menu entry: the module is not in the
 * school's plan, with a way to Billing for a role that may open it.
 */
export function PlanUpgradeModal({ isOpen, onClose, feature }) {
  const { t, canViewBilling, headline, hint } = useUpgradeCopy(feature);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('upgradeTitle')}
      size="sm"
      closeOnBackdrop
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t('close')}
          </button>
          {canViewBilling && (
            <Link
              href="/dashboard/billing"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 no-underline"
            >
              <CreditCard className="w-4 h-4" />
              {t('viewBilling')}
            </Link>
          )}
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex-shrink-0">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-gray-900 dark:text-gray-100">{headline}</p>
          <p className="text-gray-600 dark:text-gray-400">{hint}</p>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Rendered in place of a page whose module is not in the plan (someone opened
 * the URL directly, or the plan changed while it was open).
 */
export function UpgradeRequired({ feature }) {
  const { t, canViewBilling, headline, hint } = useUpgradeCopy(feature);
  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('upgradeTitle')}</h2>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{headline}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 no-underline"
          >
            <House className="w-4 h-4" />
            {t('backHome')}
          </Link>
          {canViewBilling && (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 no-underline"
            >
              <CreditCard className="w-4 h-4" />
              {t('viewBilling')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Layout-level guard: renders the upgrade screen instead of `children` when
 * `feature` (from featureForPath) is out of the plan. Fail-open while loading.
 */
export function PlanRouteGuard({ feature, isEnabled, children }) {
  if (feature && !isEnabled(feature)) return <UpgradeRequired feature={feature} />;
  return children;
}
