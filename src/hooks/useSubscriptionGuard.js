'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { getCurrentSubscription } from '@/services/billing';
import { evaluateSubscription } from '@/utils/subscriptionState';

const REFRESH_MS = 5 * 60 * 1000; // re-check so the state crosses into grace/blocked while a tab is open

// Resolves the logged-in school's subscription state for the global guard.
// Super-admins have no schoolId → the query is disabled and the guard stays
// silent. While loading or on a fetch error we return state `null` (fail-open),
// so a transient failure never locks a school out.
export const useSubscriptionGuard = () => {
  const user = useUserStore((s) => s.user);
  const schoolId = user?.schoolId || null;
  const queryClient = useQueryClient();

  const { data, isSuccess } = useQuery({
    queryKey: ['subscription', 'current', schoolId],
    queryFn: () => getCurrentSubscription(schoolId),
    enabled: !!schoolId,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  });

  // A 402 from any write means the gate just blocked us → re-check state now so
  // the block/banner appears immediately instead of on the next poll.
  useEffect(() => {
    if (typeof window === 'undefined' || !schoolId) return undefined;
    const onBlocked = () =>
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current', schoolId] });
    window.addEventListener('subscription:blocked', onBlocked);
    return () => window.removeEventListener('subscription:blocked', onBlocked);
  }, [queryClient, schoolId]);

  if (!schoolId || !isSuccess) {
    return { state: null, endDate: null, hardBlockAt: null };
  }

  return evaluateSubscription(data?.data ?? null);
};
