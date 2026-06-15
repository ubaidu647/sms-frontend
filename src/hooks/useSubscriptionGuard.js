import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { getMyCurrentSubscription } from '../services/billing';
import { isSuperAdmin } from '../utils/permissions';
import { evaluateSubscription } from '../utils/subscriptionState';

const REFRESH_MS = 5 * 60 * 1000; // re-check so the state crosses into grace/blocked while the app is open

// Resolves the logged-in school's subscription state for the global guard.
// Uses the token-scoped /me read (schoolId comes from the token). Super-admins
// have no school → the query is disabled and the guard stays silent. While
// loading or on a fetch error we return state `null` (fail-open), so a transient
// failure never locks a school out.
export const useSubscriptionGuard = () => {
  const user = useUserStore((s) => s.user);
  const isSchoolUser = !!user && !isSuperAdmin(user.role);

  const { data, isSuccess } = useQuery({
    queryKey: ['billing', 'me', 'subscription', 'current'],
    queryFn: getMyCurrentSubscription,
    enabled: isSchoolUser,
    refetchInterval: REFRESH_MS,
    staleTime: 60 * 1000,
  });

  if (!isSchoolUser || !isSuccess) {
    return { state: null, endDate: null, hardBlockAt: null };
  }

  return evaluateSubscription(data?.data ?? null);
};
