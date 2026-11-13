'use client';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { getSchoolSettings } from '@/services/schoolSettings';
import { SCHOOL_SETTINGS_KEY } from '@/hooks/usePlanFeatures';
import {
  DEFAULT_SCHOOL_CURRENCY,
  currencyFromSettings,
  schoolCurrency,
  setSchoolCurrency,
} from '@/utils/schoolCurrency';

/**
 * The school's own currency, { code, symbol }, from the shared settings query
 * (same key as usePlanFeatures and the Business Settings pages, so one fetch
 * serves them all and a save there updates every caller).
 *
 * While loading, on error, and for users without a school, it is the currency
 * the dashboard loader already recorded (useSchoolSettings), else PKR / Rs.
 * Platform billing must not use this: it stays in the platform's currency.
 */
export function useSchoolCurrency() {
  const schoolId = useUserStore((s) => s.user?.schoolId || null);
  const settings = useQuery({
    queryKey: SCHOOL_SETTINGS_KEY,
    queryFn: getSchoolSettings,
    enabled: !!schoolId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const data = settings.isSuccess ? settings.data?.data : undefined;

  const currency = useMemo(
    () =>
      data ? currencyFromSettings(data) : schoolId ? schoolCurrency() : DEFAULT_SCHOOL_CURRENCY,
    [data, schoolId],
  );

  // Keep the formatters that run outside components (constants/* formatMoney)
  // on the same currency.
  useEffect(() => {
    if (data) setSchoolCurrency(currency);
  }, [data, currency]);

  return currency;
}
