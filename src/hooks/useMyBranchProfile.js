import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export function useMyBranchProfile({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['branch-profile', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/branch-profile/me');
      return data;
    },
    enabled,
    staleTime: 60000,
    retry: false,
  });
}
