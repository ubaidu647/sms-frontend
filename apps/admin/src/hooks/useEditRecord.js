import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';

/**
 * The full record an Edit modal prefills from and diffs against, for lists
 * whose rows carry only some of its fields. Fetched fresh on each open under
 * its own key: nothing re-delivers it while the form is being edited, and a
 * cached copy can't become the baseline.
 */
export function useEditRecord({ kind, id, url, isOpen, token }) {
  return useQuery({
    queryKey: [kind, id],
    queryFn: () => fetchData({ url, token }),
    enabled: !!token && !!id && isOpen,
    staleTime: 0,
    gcTime: 0,
    refetchOnReconnect: false,
    retry: retryUnless4xx,
  });
}
