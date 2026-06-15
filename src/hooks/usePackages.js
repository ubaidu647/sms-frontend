import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { listPackages, createPackage, updatePackage, deletePackage } from '../services/system';

export const usePackages = ({ page = 1, limit = 20, filters = {}, enabled = true } = {}) =>
  useQuery({
    queryKey: ['packages', { page, limit, ...filters }],
    queryFn: () =>
      listPackages({ page, limit, search: filters.search, isActive: filters.isActive }),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useCreatePackage = ({ onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createPackage(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      Toast.show({ type: 'success', text1: res?.message || 'Package created' });
      onSuccess?.(res?.data);
    },
    onError: (err) =>
      Toast.show({ type: 'error', text1: 'Create failed', text2: err.message }),
  });
};

export const useUpdatePackage = ({ onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updatePackage(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      Toast.show({ type: 'success', text1: res?.message || 'Package updated' });
      onSuccess?.(res?.data);
    },
    onError: (err) =>
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.message }),
  });
};

export const useDeletePackage = ({ onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deletePackage(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      Toast.show({ type: 'success', text1: res?.message || 'Package deactivated' });
      onSuccess?.(res?.data);
    },
    onError: (err) =>
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message }),
  });
};
