import { create } from "zustand";
import { api } from "@/lib/axios";
import type { User } from "@/types/user.types";
interface AuthState {
  user: User | null;
  isAuthLoading: boolean;
  // actions
  setUser: (user: User) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>; // called once on app mount
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthLoading: true, 

  setUser: (user) => set({ user }),

  clearAuth: () => set({ user: null }),
  
  initAuth: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.data });
    } catch {
      // no valid session → unauthenticated, nothing to do
      set({ user: null });
    } finally {
      set({ isAuthLoading: false });
    }
  },
}));
