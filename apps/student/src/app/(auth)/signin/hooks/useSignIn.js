import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';

export function useSignIn() {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/auth/login', data);
      return res.data; // API body: { data: { token, refreshToken, user }, ... }
    },
    onSuccess: (response) => {
      const payload = response.data || response;
      login(payload); // store tokens + user in zustand

      // Cookies the middleware reads to gate routes (mirrors the admin app).
      document.cookie = `auth-storage=${payload.token || payload.accessToken || ''}; path=/; max-age=86400;`;
      document.cookie = `auth-role=${encodeURIComponent(
        JSON.stringify(payload.user?.role || {}),
      )}; path=/; max-age=86400;`;

      toast.success('Welcome back!');
      router.push('/dashboard');
    },
    onError: (err) => {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    },
  });
}
