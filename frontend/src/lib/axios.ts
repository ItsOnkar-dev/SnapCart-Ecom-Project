// lib/axios.ts
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
      .then(() => {
        const match = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrfToken="));
        csrfToken = match ? decodeURIComponent(match.split("=")[1]) : null;
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
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (err: unknown) => void;
}> = [];

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

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use a raw axios call, NOT `api`, so this request never
      // passes back through this same interceptor chain.
      // Read CSRF token from cookie manually — the request interceptor that
      // normally attaches x-csrf-token won't run on this raw call.
      const csrfFromCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrfToken="))
        ?.split("=")[1];

      const refreshHeaders: Record<string, string> = {};
      if (csrfFromCookie) {
        refreshHeaders["x-csrf-token"] = csrfFromCookie;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true, headers: refreshHeaders },
      );
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
