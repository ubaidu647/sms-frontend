import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useBranchProfile(branchId) {
  return useQuery({
    queryKey: ['branch-profile', 'branch', branchId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/branch-profile/branch/${branchId}`);
      return data;
    },
    enabled: !!branchId,
    staleTime: 60000,
    retry: false,
  });
}
