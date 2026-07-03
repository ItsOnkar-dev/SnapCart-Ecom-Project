import axios from "axios";
import { useAuthStore } from "../store/auth.store";

// base instance — all API calls go through here
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // https://snapcart-production.up.railway.app/api
  withCredentials: true, // sends httpOnly refresh token cookie automatically
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// attaches the in-memory access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// tracks whether a silent refresh is already in-flight
// prevents multiple 401s from firing multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

// drains the queue after refresh succeeds or fails
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response, // 2xx — pass straight through

  async (error) => {
    const originalRequest = error.config;

    // only attempt silent refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // another refresh is already in-flight — queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(Promise.reject);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // the refresh token lives in an httpOnly cookie — no manual header needed
      const { data } = await api.post("/auth/refresh-token");
      const newAccessToken: string = data.accessToken;

      useAuthStore.getState().setAccessToken(newAccessToken);
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth(); // refresh failed → force logout
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
