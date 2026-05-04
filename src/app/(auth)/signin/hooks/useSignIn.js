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

      const type = payload.user?.type || response.type;
      if (type === 'staff') {
        router.push('/dashboard/school');
      } else {
        // student and parent dashboards coming later
        router.push('/dashboard');
      }
    },
    onError: (err) => {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    },
  });
}
