import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function useSignIn() {
  const { login } = useAuth();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/auth/login', data);
      return res.data; // axios wraps response in data
    },
    onSuccess: (response) => {
      // `response` is the API body { data: { token, refreshToken, user }, status, message }
      const payload = response.data || response;
      login(payload); // stores user + tokens in Zustand
      document.cookie = `auth-storage=${payload.token || payload.accessToken || ''}; path=/; max-age=86400;`;
      document.cookie = `auth-role=${encodeURIComponent(
        JSON.stringify(payload.user?.role || {}),
      )}; path=/; max-age=86400;`;
      toast.success('Logged in successfully!');

      // Always push to /dashboard — middleware reads the auth-role cookie
      // (set above) and forwards super-admin → /dashboard/system,
      // admin/sub-admin → /dashboard/school. Keeps the route decision in
      // one place so super-admin doesn't land on the school view.
      router.push('/dashboard');
    },
    onError: (err) => {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    },
  });
}
