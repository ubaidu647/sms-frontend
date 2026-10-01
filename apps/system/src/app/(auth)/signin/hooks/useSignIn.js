import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { writeRoleCookie } from '@/utils/session';

export function useSignIn() {
  const { login } = useAuth();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data) => {
      // Dedicated super-admin portal. /auth/login is the school portal and now
      // refuses a super-admin outright, so this must not fall back to it.
      const res = await apiClient.post('/auth/system/login', data);
      return res.data; // axios wraps response in data
    },
    onSuccess: (response) => {
      // `response` is the API body { data: { user }, status, message } — the tokens
      // came back as httpOnly cookies and are never visible to this page.
      const payload = response.data || response;
      login(payload); // stores the user and marks the session
      writeRoleCookie(payload.user?.role);
      toast.success('Logged in successfully!');

      // This console only admits super-admin. Middleware reads the auth-role
      // cookie set above and bounces any other role to /unauthorized, so we
      // can always push to /dashboard here.
      router.push('/dashboard');
    },
    onError: (err) => {
      // 429s are toasted once, globally, by the apiClient interceptor — skip here
      // to avoid a duplicate toast (and let the form drive the retry countdown).
      if (err.response?.status === 429) return;
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      toast.error(message);
    },
  });
}
