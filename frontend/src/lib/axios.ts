import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

let csrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;

const getCsrfToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken;

  if (!csrfPromise) {
    csrfPromise = axios
      .get(`${import.meta.env.VITE_API_URL}/auth/csrf-token`, {
        withCredentials: true,
      })
      .then((res) => {
        csrfToken = res.data?.data?.csrfToken ?? null;
        return csrfToken;
      })
      .catch(() => null)
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // browser attaches httpOnly cookies automatically
});

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

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toUpperCase();

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = await getCsrfToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.set("x-csrf-token", token);
    }
  }

  return config;
});

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
