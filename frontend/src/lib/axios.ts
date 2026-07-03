import axios from "axios";
import { useAuthStore } from "../store/auth.store";

// base instance — all API calls go through here
// tokens are httpOnly cookies (accessToken + refreshToken) — the browser
// attaches them automatically on every request, no manual header needed
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // https://snapcart-production.up.railway.app/api
  withCredentials: true, // browser attaches httpOnly cookies automatically
});

// tracks whether a silent refresh is already in-flight
// prevents multiple 401s from firing multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (err: unknown) => void;
}> = [];

// drains the queue after refresh succeeds or fails
const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

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
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // both tokens live in httpOnly cookies — the backend reads the
      // refreshToken cookie and sets a fresh accessToken cookie in the response
      await api.post("/auth/refresh");
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      useAuthStore.getState().clearAuth(); // refresh failed → force logout
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
