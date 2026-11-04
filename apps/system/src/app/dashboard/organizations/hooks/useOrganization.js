import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/services/apiClient';
import { fetchData, patchData, postData } from '@/utils/api';

// Server-side paginated school list. `tab` picks the active / disabled split
// (disabled = isActive false OR status suspended); `search` matches the name;
// `status` narrows to one lifecycle status; `createdOn` (YYYY-MM-DD) to one day.
// Returns the raw envelope: { data: School[], total }.
export const useOrganizations = ({
  token,
  page = 1,
  limit = 20,
  tab = 'active',
  search = '',
  status = '',
  createdOn = '',
}) => {
  const columnFilters = [];
  const columnFiltersOr = [];
  if (tab === 'disabled') {
    columnFiltersOr.push({ id: 'isActive', value: false }, { id: 'status', value: 'suspended' });
  } else {
    columnFilters.push({ id: 'isActive', value: true });
  }
  if (search) columnFilters.push({ id: 'name', value: search });
  if (status) columnFilters.push({ id: 'status', value: status });
  const dateParams = createdOn ? { fromDate: createdOn, toDate: createdOn } : {};

  return useQuery({
    queryKey: ['organizations', 'list', { page, limit, tab, search, status, createdOn }],
    queryFn: () =>
      fetchData({
        url: '/schools',
        page,
        limit,
        columnFilters,
        columnFiltersOr,
        token,
        ...dateParams,
      }),
    placeholderData: keepPreviousData,
    enabled: !!token,
  });
};

export const useToggleSchoolStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Enabling must also lift a suspension: `isActive:true` alone leaves a
    // suspended school locked out. Disabling only flips isActive.
    mutationFn: ({ id, isActive }) =>
      patchData({
        url: `/schools/${id}/status`,
        payload: isActive ? { isActive: true, status: 'active' } : { isActive: false },
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'School status updated');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update school status'),
  });
};

// The school's admin accounts (predefined admin role) — who a password reset can
// target. `isPrimary` marks the account created at registration.
export const useSchoolAdmins = (schoolId, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['organizations', 'admins', schoolId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/schools/${schoolId}/admins`);
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled: !!schoolId && enabled,
    // The list feeds a one-off action; never serve a stale copy.
    staleTime: 0,
    gcTime: 0,
  });

// Reset a school admin's password. Without `newPassword` the API generates a
// temporary one and returns it once (data.temporaryPassword); it is never
// cached here — the caller holds it in component state only. Errors are shown
// inline by the caller, so no toast.
export const useResetSchoolAdminPassword = () =>
  useMutation({
    mutationFn: ({ schoolId, userId, newPassword }) =>
      postData({
        url: `/schools/${schoolId}/admin/reset-password`,
        payload: {
          ...(userId ? { userId } : {}),
          ...(newPassword ? { newPassword } : {}),
        },
      }),
  });
