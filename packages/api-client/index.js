import axios from 'axios';

/**
 * Create a shared axios instance pointing at the SMS backend.
 * Both admin and student apps build their service layer on top of this,
 * so the backend contract lives in one place.
 *
 * @param {Object} [opts]
 * @param {string} [opts.baseURL] - defaults to NEXT_PUBLIC_BACKEND_URL
 * @param {() => string | null} [opts.getToken] - returns the auth token, if any
 */
export function createApiClient({ baseURL, getToken } = {}) {
  const client = axios.create({
    baseURL: baseURL || process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true,
  });

  if (getToken) {
    client.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  return client;
}
