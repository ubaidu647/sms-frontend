'use client';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { getSchoolSettings } from '@/services/schoolSettings';
import { useSubscriptionStatusQuery } from '@/hooks/useSubscriptionGuard';
import {
  gateState,
  isFeatureEnabled,
  lockedModuleDisplayOf,
  normalizeFeatures,
} from '@/utils/planFeatures';

// Same key as the Business Settings pages, so saving the display choice there
// (setQueryData) updates every menu at once.
export const SCHOOL_SETTINGS_KEY = ['school', 'settings'];

/**
 * The school's plan modules for menus, role forms and the route guard.
 *
 *   features   — enabled add-on keys, or null (= all open)
 *   isEnabled  — (featureKey) → boolean; core / unknown keys are always open
 *   gate       — (featureKey) → 'show' | 'lock' | 'hide'
 *   display    — the school's choice for out-of-plan modules: 'lock' | 'hide'
 *
 * Fail-open: while loading, on any error, and for users without a school
 * (super-admin) everything counts as enabled, so menus never flash locks and
 * a failed request never shuts a module. The API still refuses for real.
 */
export function usePlanFeatures() {
  const schoolId = useUserStore((s) => s.user?.schoolId || null);
  const status = useSubscriptionStatusQuery();
  const rawFeatures = status.isSuccess ? status.data?.data?.features : undefined;
  const features = useMemo(() => normalizeFeatures(rawFeatures), [rawFeatures]);

  const settings = useQuery({
    queryKey: SCHOOL_SETTINGS_KEY,
    queryFn: getSchoolSettings,
    enabled: !!schoolId,
    // getSchoolSettings drops the HTTP status; one retry is enough for a
    // display preference that falls back to 'lock'.
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const display = lockedModuleDisplayOf(settings.data?.data);

  const isEnabled = useCallback((key) => isFeatureEnabled(features, key), [features]);
  const gate = useCallback((key) => gateState(features, key, display), [features, display]);

  return {
    features,
    isEnabled,
    gate,
    display,
    packageName: status.data?.data?.packageName ?? null,
    isLoading: status.isPending && !!schoolId,
  };
}
