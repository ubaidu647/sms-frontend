import { useQuery } from '@tanstack/react-query';
import { fetchData } from '../services/api';

export function useBranchProfilesList({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['branch-profiles-list'],
    queryFn: () => fetchData({ url: '/branch-profile/list' }),
    enabled,
    staleTime: 60000,
    retry: false,
  });
}

export function useBranchesDropdown({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 200 }),
    enabled,
    staleTime: 60000,
    retry: false,
  });
}
