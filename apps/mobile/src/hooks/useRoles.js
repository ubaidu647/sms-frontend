import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import apiClient from '../services/apiClient';
import { fetchData } from '../services/api';

export function useRolesList({ page, limit, filters, branchId, enabled = true }) {
  const params = {
    name: filters?.name || undefined,
    serialNumber: filters?.serialNumber || undefined,
    actions: filters?.actions?.length ? filters.actions.join(',') : undefined,
    menus: filters?.menus?.length ? filters.menus.join(',') : undefined,
    branchName: filters?.branchName || undefined,
    fromDate: filters?.fromDate || undefined,
    toDate: filters?.toDate || undefined,
    isActive: filters?.isActive === '' ? undefined : filters?.isActive,
    branchId: branchId || undefined,
  };

  return useQuery({
    queryKey: ['roles', page, limit, params],
    queryFn: () =>
      fetchData({
        url: '/role/list',
        page,
        limit,
        ...params,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useRoleDetail(roleId) {
  return useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/role/${roleId}`);
      return data?.data;
    },
    enabled: !!roleId,
    staleTime: 30_000,
  });
}

export function useCreateRole({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/role/create', payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-dropdown'] });
      Toast.show({ type: 'success', text1: res?.message || 'Role created' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Could not create role';
      Toast.show({ type: 'error', text1: 'Create failed', text2: msg });
    },
  });
}

export function useUpdateRole({ roleId, onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.put(`/role/${roleId}`, payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-detail', roleId] });
      queryClient.invalidateQueries({ queryKey: ['roles-dropdown'] });
      Toast.show({ type: 'success', text1: res?.message || 'Role updated' });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Could not update role';
      Toast.show({ type: 'error', text1: 'Update failed', text2: msg });
    },
  });
}

export function useToggleRoleStatus({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId) => {
      const { data } = await apiClient.patch(`/role/${roleId}/toggle-status`);
      return { ...data, roleId };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-detail', res.roleId] });
      Toast.show({ type: 'success', text1: res?.message || 'Role status updated' });
      onSuccess?.(res);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Toggle failed';
      Toast.show({ type: 'error', text1: 'Toggle failed', text2: msg });
    },
  });
}

export function useDeleteRole({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId) => {
      const { data } = await apiClient.delete(`/role/${roleId}`);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-dropdown'] });
      Toast.show({ type: 'success', text1: res?.message || 'Role deleted' });
      onSuccess?.(res);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Delete failed';
      Toast.show({ type: 'error', text1: 'Delete failed', text2: msg });
    },
  });
}
