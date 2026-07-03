import { create } from "zustand";
import { api } from "../lib/axios";
import type { User } from "../types/user.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthLoading: boolean;

  // actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>; // called once on app mount
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthLoading: true, // optimistic — assume we might be logged in until /me resolves

  setAuth: (user, accessToken) => set({ user, accessToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  clearAuth: () => set({ user: null, accessToken: null }),

  // silent boot — tries to get a fresh access token via the refresh cookie,
  // then fetches the current user; if either fails, user stays null (not logged in)
  initAuth: async () => {
    try {
      const refreshRes = await api.post("/auth/refresh-token");
      const accessToken: string = refreshRes.data.accessToken;

      // manually set the header before the /me call
      // (the interceptor reads from store, which hasn't updated yet at this exact moment)
      const meRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      set({ user: meRes.data.user, accessToken });
    } catch {
      // no valid refresh cookie → unauthenticated, nothing to do
      set({ user: null, accessToken: null });
    } finally {
      set({ isAuthLoading: false });
    }
  },
}));
