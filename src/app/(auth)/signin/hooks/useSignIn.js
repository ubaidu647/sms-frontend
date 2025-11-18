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
      console.log('use singin response', response.data);
      login(response.data); // stores user + tokens in Zustand
      document.cookie = `auth-storage=${response.token}; path=/; max-age=86400;`;
      document.cookie = `auth-role=${encodeURIComponent(
        JSON.stringify(response.data.user.role),
      )}; path=/; max-age=86400;`;
      toast.success('Logged in successfully!');
      // ✅ redirect to dashboard
      router.push('/dashboard');
    },
    onError: (err) => {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    },
  });
}
