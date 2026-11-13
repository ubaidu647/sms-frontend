'use client';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Banknote, Info, Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/userStore';
import { getSchoolSettings, updateSchoolSettings } from '@/services/schoolSettings';
import { SCHOOL_SETTINGS_KEY } from '@/hooks/usePlanFeatures';
import { PLATFORM_CURRENCY_SYMBOL } from '@/utils/platformMoney';
import { SCHOOL_CURRENCIES, currencyFromSettings, setSchoolCurrency } from '@/utils/schoolCurrency';

// The currency the school's own money is labelled in (fees, vouchers,
// salaries, fines, shop). A label only: the API converts no stored amount.
// PATCH /schools/settings is the school admin's alone, so only that role sees
// the control — same gate as the Plan Modules and Academic Year tabs.
export default function CurrencySettingsPage() {
  const t = useTranslations('currencySettings');
  const { user } = useUserStore();
  const isAdmin = !!user?.role?.isPredefined;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SCHOOL_SETTINGS_KEY,
    queryFn: getSchoolSettings,
    enabled: isAdmin,
  });
  const saved = currencyFromSettings(query.data?.data);
  const savedInfo = SCHOOL_CURRENCIES.find((c) => c.code === saved.code);

  const [value, setValue] = useState(saved.code);
  useEffect(() => {
    if (query.data) setValue(saved.code);
  }, [query.data, saved.code]);
  const dirty = !!query.data && value !== saved.code;

  const save = useMutation({
    mutationFn: () => updateSchoolSettings({ currency: value }),
    onSuccess: (res) => {
      // Same cache entry useSchoolCurrency reads, so every screen follows.
      qc.setQueryData(SCHOOL_SETTINGS_KEY, res);
      setSchoolCurrency(currencyFromSettings(res?.data));
      // Refetch what is on screen so every amount re-renders with the new label.
      qc.invalidateQueries();
      toast.success(t('saved'));
    },
    onError: (err) => toast.error(err.message || t('saveFailed')),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-3xl mx-auto w-full pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30">
            <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t('warningTitle')}</p>
                <p className="text-xs">{t('warningBody')}</p>
              </div>
            </div>

            {query.isLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : query.isError ? (
              <p className="text-sm text-red-600">{query.error?.message || t('loadFailed')}</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="school-currency"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    {t('fieldLabel')}
                  </label>
                  <select
                    id="school-currency"
                    value={value}
                    disabled={save.isPending}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full sm:w-96 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:opacity-60"
                  >
                    {SCHOOL_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {t('option', { name: c.name, code: c.code, symbol: c.symbol })}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('current', {
                      name: savedInfo?.name || saved.code,
                      code: saved.code,
                      symbol: saved.symbol,
                    })}
                  </p>
                </div>
                <p className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Info className="w-4 h-4 shrink-0" />
                  {t('platformNote', { symbol: PLATFORM_CURRENCY_SYMBOL })}
                </p>
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
        )}
      </div>
    </div>
  );
}
