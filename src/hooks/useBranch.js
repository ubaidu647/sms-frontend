import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

function findInBranchesCache(queryClient, branchId) {
  if (!branchId) return null;
  const matches = queryClient.getQueriesData({ queryKey: ['branches'] });
  for (const [, cached] of matches) {
    const list = cached?.data;
    if (Array.isArray(list)) {
      const hit = list.find((b) => b?._id === branchId);
      if (hit) return hit;
    }
  }
  return null;
}

export function useBranch(branchId) {
  const queryClient = useQueryClient();
  const cached = findInBranchesCache(queryClient, branchId);

  const query = useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/branch/${branchId}`);
      return data;
    },
    enabled: !!branchId,
    staleTime: 60000,
    retry: false,
    initialData: cached
      ? { data: cached, message: 'Branch from cache' }
      : undefined,
  });

  return {
    ...query,
    // If the network request 404s but we have cached list data, surface that
    // instead of an error screen.
    data: query.data || (cached ? { data: cached } : undefined),
    error: cached ? null : query.error,
  };
}
