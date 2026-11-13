'use client';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Blocks, CheckCircle2, EyeOff, Info, Loader2, Lock, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { getSchoolSettings, updateSchoolSettings } from '@/services/schoolSettings';
import { SCHOOL_SETTINGS_KEY, usePlanFeatures } from '@/hooks/usePlanFeatures';
import { PLAN_FEATURE_KEYS, lockedModuleDisplayOf } from '@/utils/planFeatures';
import { moduleName } from '@/component/PlanUpgrade';

const DISPLAY_OPTIONS = [
  { value: 'lock', icon: Lock, labelKey: 'displayLock', hintKey: 'displayLockHint' },
  { value: 'hide', icon: EyeOff, labelKey: 'displayHide', hintKey: 'displayHideHint' },
];

// Which add-on modules the school's plan includes, and how the menus show the
// ones it does not: dimmed with a lock, or left out. PATCH /schools/settings
// is the school admin's alone, so only that role sees the controls.
export default function PlanModulesSettingsPage() {
  const t = useTranslations('planFeatures');
  const { user } = useUserStore();
  const isAdmin = !!user?.role?.isPredefined;
  const qc = useQueryClient();
  const { features, isEnabled, packageName, isLoading: planLoading } = usePlanFeatures();

  const query = useQuery({
    queryKey: SCHOOL_SETTINGS_KEY,
    queryFn: getSchoolSettings,
    enabled: isAdmin,
  });
  const saved = lockedModuleDisplayOf(query.data?.data);

  const [value, setValue] = useState(saved);
  useEffect(() => {
    if (query.data) setValue(saved);
  }, [query.data, saved]);
  const dirty = !!query.data && value !== saved;

  const save = useMutation({
    mutationFn: () => updateSchoolSettings({ lockedModuleDisplay: value }),
    onSuccess: (res) => {
      // Same cache entry the sidebar reads, so every menu follows at once.
      qc.setQueryData(SCHOOL_SETTINGS_KEY, res);
      toast.success(t('saved'));
    },
    onError: (err) => toast.error(err.message || t('saveFailed')),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-3xl mx-auto w-full pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30">
            <Blocks className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('pageTitle')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('pageSubtitle')}</p>
          </div>
        </div>

        {!isAdmin ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('adminOnly')}</p>
          </div>
        ) : (
          <>
            {/* What the plan includes */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('includedHeading')}
                </h2>
                {packageName && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('planLabel', { name: packageName })}
                  </span>
                )}
              </div>
              {planLoading ? (
                <div className="py-6 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {features === null && (
                    <p className="text-sm text-teal-700 dark:text-teal-400">{t('allIncluded')}</p>
                  )}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLAN_FEATURE_KEYS.map((key) => {
                      const on = isEnabled(key);
                      return (
                        <li
                          key={key}
                          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                            on
                              ? 'border-teal-200 bg-teal-50/60 dark:border-teal-800 dark:bg-teal-900/20'
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60'
                          }`}
                        >
                          <span
                            className={
                              on
                                ? 'font-medium text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }
                          >
                            {moduleName(t, key)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              on
                                ? 'text-teal-700 dark:text-teal-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {on ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            {on ? t('included') : t('notIncluded')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <p className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-4 h-4 shrink-0" />
                {t('coreNote')}
              </p>
            </div>

            {/* How the menus show what it does not include */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('displayHeading')}
              </h2>
              {query.isLoading ? (
                <div className="py-6 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : query.isError ? (
                <p className="text-sm text-red-600">{query.error?.message || t('loadFailed')}</p>
              ) : (
                <>
                  <div
                    role="radiogroup"
                    aria-label={t('displayHeading')}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {DISPLAY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const checked = value === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                            checked
                              ? 'border-teal-500 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20'
                              : 'border-gray-200 hover:border-teal-300 dark:border-gray-700 dark:hover:border-teal-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="locked-module-display"
                            value={opt.value}
                            checked={checked}
                            disabled={save.isPending}
                            onChange={() => setValue(opt.value)}
                            className="mt-1 accent-teal-600"
                          />
                          <span className="space-y-0.5">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                              <Icon className="w-4 h-4" />
                              {t(opt.labelKey)}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {t(opt.hintKey)}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('rolesNote')}</p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!dirty || save.isPending}
                      onClick={() => save.mutate()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {save.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {t('save')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
