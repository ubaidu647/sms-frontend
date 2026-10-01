'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import { getMySubscriptionStatus } from '@/services/billing';
import { fromStatusResponse } from '@/utils/subscriptionState';

const REFRESH_MS = 5 * 60 * 1000; // re-check so the state crosses into grace/blocked while a tab is open
const UNKNOWN = { state: null, endDate: null, hardBlockAt: null, packageName: null };

const isClientError = (err) => err?.status >= 400 && err?.status < 500;

// Resolves the logged-in school's subscription state for the global guard via
// GET /subscription/me/status, which ANY signed-in tenant user may read (the
// guard must work for staff without 'view-billing'). Super-admins have no
// schoolId → the query is disabled and the guard stays silent. While loading or
// on any error (403/404 included) we return state `null` (fail-open), so a
// transient failure never locks a school out. 4xx are not retried and stop the
// poll, so an unavailable endpoint never causes a request storm.
export const useSubscriptionGuard = () => {
  const user = useUserStore((s) => s.user);
  const schoolId = user?.schoolId || null;
  const userId = user?._id || user?.id || null;
  const queryClient = useQueryClient();
  const queryKey = ['subscription', 'me', 'status', schoolId, userId];

  const { data, isSuccess } = useQuery({
    queryKey,
    queryFn: getMySubscriptionStatus,
    enabled: !!schoolId,
    retry: (failureCount, err) => !isClientError(err) && failureCount < 2,
    refetchInterval: (query) => (isClientError(query.state.error) ? false : REFRESH_MS),
    refetchOnWindowFocus: (query) => !isClientError(query.state.error),
    staleTime: 60 * 1000,
  });

  // A 402 from any write means the gate just blocked us → re-check state now so
  // the block/banner appears immediately instead of on the next poll.
  useEffect(() => {
    if (typeof window === 'undefined' || !schoolId) return undefined;
    const onBlocked = () =>
      queryClient.invalidateQueries({ queryKey: ['subscription', 'me', 'status'] });
    window.addEventListener('subscription:blocked', onBlocked);
    return () => window.removeEventListener('subscription:blocked', onBlocked);
  }, [queryClient, schoolId]);

  if (!schoolId || !isSuccess) return UNKNOWN;

  return fromStatusResponse(data?.data ?? null);
};
