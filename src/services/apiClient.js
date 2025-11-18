import axios from "axios";
import { useTokenStore } from "@/store/tokenStore";
import { clearAuthCookies } from "@/utils/clearAuthCookies";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((c) => {
    const t = useTokenStore.getState().accessToken;
    if (t) c.headers.Authorization = `Bearer ${t}`;
    return c;
});

function handleLogoutAndRedirect() {
    useTokenStore.getState().clearTokens();
    clearAuthCookies();
    if (typeof window !== "undefined") window.location.replace("/signin");
}

let isRefreshing = false;
let refreshSubscribers = [];

apiClient.interceptors.response.use(
    (r) => r,
    async (error) => {
        const orig = error.config;
        const status = error.response?.status;
        const store = useTokenStore.getState();

        if (status === 401 && !orig._retry) {
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
                    const res = await axios.post(
                        `${apiClient.defaults.baseURL}/auth/refresh`,
                        { refreshToken: store.refreshToken },
                        { withCredentials: true }
                    );
                    const { accessToken, refreshToken } = res.data.data;
                    store.setTokens({ accessToken, refreshToken });
                    console.log("useTokenStore.getState().accessToken", useTokenStore.getState().accessToken)
                    refreshSubscribers.forEach((cb) => cb(accessToken));
                    refreshSubscribers = [];
                    return retry;
                } catch (e) {
                    refreshSubscribers.forEach((cb) => cb(null));
                    refreshSubscribers = [];
                    handleLogoutAndRedirect();
                    // return Promise.reject(e);
                    return Promise.resolve(null)
                } finally {
                    isRefreshing = false;
                }
            }
            return retry;
        }
        return Promise.reject(error);
    }
);

export default apiClient;
