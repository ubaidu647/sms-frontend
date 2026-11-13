'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { PLAN_FEATURE_KEYS, enabledPlanFeatures } from '@/utils/planFeatures';

const chipCls = 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium';

// The add-on modules a package includes, as labelled chips. A legacy list
// (empty / free text) opens everything and reads "All modules".
export default function ModuleChips({ features, className = '' }) {
  const t = useTranslations('planModules');
  const enabled = enabledPlanFeatures(features);
  if (enabled === null) {
    return (
      <span
        className={`${chipCls} bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300`}
      >
        {t('allModules')}
      </span>
    );
  }
  if (enabled.length === 0) {
    return (
      <span className={`${chipCls} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`}>
        {t('coreOnly')}
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-wrap gap-1.5 ${className}`}>
      {enabled.map((key) => (
        <span
          key={key}
          className={`${chipCls} bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800`}
        >
          {t(`modules.${key}`)}
        </span>
      ))}
    </span>
  );
}

// Compact summary for a table cell: "All modules", "Core only" or "3 of 10".
export function ModuleSummary({ features }) {
  const t = useTranslations('planModules');
  const enabled = enabledPlanFeatures(features);
  if (enabled === null) return t('allModules');
  if (enabled.length === 0) return t('coreOnly');
  return t('columnCount', { count: enabled.length, total: PLAN_FEATURE_KEYS.length });
}
