import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import apiClient from '../services/apiClient';
import { useAuth } from './useAuth';
import { isSuperAdmin } from '../utils/permissions';

export function useSignIn() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/auth/login', data);
      return res.data;
    },
    onSuccess: (response) => {
      const payload = response.data || response;
      login(payload);
      Toast.show({ type: 'success', text1: 'Logged in successfully!' });
      // Super-admins go to the system module; everyone else to the school dashboard.
      const dest = isSuperAdmin(payload.user?.role)
        ? '/(app)/system/organizations'
        : '/(app)/dashboard';
      router.replace(dest);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || err?.message || 'Something went wrong';
      Toast.show({ type: 'error', text1: 'Login failed', text2: message });
    },
  });
}
