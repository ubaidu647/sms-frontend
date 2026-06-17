import axios from 'axios';
import { useTokenStore } from '@/store/tokenStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every request.
apiClient.interceptors.request.use((config) => {
  const token = useTokenStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 (expired/invalid session) clear auth and send the student back to login.
// A failed login itself returns 401 too, so skip the redirect for that endpoint.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.includes('/auth/login')) {
      useTokenStore.getState().clearTokens();
      clearAuthCookies();
      if (typeof window !== 'undefined') window.location.replace('/signin');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
