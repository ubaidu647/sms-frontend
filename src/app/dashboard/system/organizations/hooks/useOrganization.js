import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useOrganizationStore } from '../store/organizationStore';

export const useOrganizations = ({
  token,
  page = 1,
  limit = 20,
  columnFilters = [],
  columnFiltersOr = [],
}) => {
  const setOrganizations = useOrganizationStore((state) => state.setOrganizations);

  return useQuery({
    queryKey: ['organizations', page, limit, columnFilters, columnFiltersOr],
    queryFn: async () => {
      const response = await fetchData({
        url: '/schools',
        page,
        limit,
        columnFilters,
        columnFiltersOr,
        token,
      });
      setOrganizations(response.data); // save in Zustand
      return response;
    },
    keepPreviousData: true,
    enabled: !!token, // only fetch if token exists
  });
};
