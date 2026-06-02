import axios from 'axios';
import { router } from 'expo-router';
import { useTokenStore } from '../store/tokenStore';
import { BACKEND_URL } from '../config/env';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((c) => {
  const t = useTokenStore.getState().accessToken;
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

function handleLogoutAndRedirect() {
  useTokenStore.getState().clearTokens();
  router.replace('/(auth)/signin');
}

let isRefreshing = false;
let refreshSubscribers = [];

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    const status = error.response?.status;
    const store = useTokenStore.getState();

    if (status === 401 && !orig._retry && !orig.url.includes('/auth/login')) {
      orig._retry = true;

      if (!store.refreshToken) {
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }

      const retry = new Promise((resolve) => {
        refreshSubscribers.push((newT) => {
          if (newT) {
            orig.headers.Authorization = `Bearer ${newT}`;
            resolve(apiClient(orig));
          } else resolve(null);
        });
      });

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(`${BACKEND_URL}/auth/refresh`, {
            refreshToken: store.refreshToken,
          });
          const { accessToken, refreshToken } = res.data.data;
          store.setTokens({ accessToken, refreshToken });
          refreshSubscribers.forEach((cb) => cb(accessToken));
          refreshSubscribers = [];
          return retry;
        } catch {
          refreshSubscribers.forEach((cb) => cb(null));
          refreshSubscribers = [];
          handleLogoutAndRedirect();
          return Promise.resolve(null);
        } finally {
          isRefreshing = false;
        }
      }
      return retry;
    }
    return Promise.reject(error);
  },
);

export default apiClient;
