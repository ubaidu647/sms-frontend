import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchData, patchData } from '@/utils/api';
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
      setOrganizations(response.data); // splits into active / disabled in the store
      return response;
    },
    keepPreviousData: true,
    enabled: !!token,
  });
};

export const useToggleSchoolStatus = () => {
  const queryClient = useQueryClient();
  const applyStatusChange = useOrganizationStore((state) => state.applyStatusChange);

  return useMutation({
    mutationFn: ({ id, isActive }) =>
      patchData({ url: `/schools/${id}/status`, payload: { isActive } }),
    onSuccess: (res) => {
      const updated = res?.data;
      if (updated) applyStatusChange(updated);
      toast.success(res?.message || 'School status updated');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update school status'),
  });
};
