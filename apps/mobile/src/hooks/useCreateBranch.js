import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import apiClient from '../services/apiClient';

export function useCreateBranch({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/branch/create', payload);
      return data;
    },
    onSuccess: (res) => {
      const branch = res?.data ?? res;
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      Toast.show({
        type: 'success',
        text1: res?.message || 'Branch created',
      });
      onSuccess?.(branch);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to create branch';
      Toast.show({ type: 'error', text1: 'Could not create branch', text2: message });
    },
  });
}
