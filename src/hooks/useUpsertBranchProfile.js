import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import apiClient from '../services/apiClient';

export function useUpsertBranchProfile({ onSuccess } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await apiClient.post('/branch-profile/upsert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (d) => d,
      });
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['branch-profile'] });
      queryClient.invalidateQueries({ queryKey: ['branch-profiles-list'] });
      Toast.show({
        type: 'success',
        text1: res?.message || 'Profile saved',
      });
      onSuccess?.(res?.data);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save profile';
      Toast.show({
        type: 'error',
        text1: 'Could not save profile',
        text2: message,
      });
    },
  });
}
