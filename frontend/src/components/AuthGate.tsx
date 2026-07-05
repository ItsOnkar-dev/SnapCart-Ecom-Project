// src/components/AuthGate.tsx
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { useAuthStore } from "../store/auth.store";

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Spinner className="w-10 h-10 animate-spin text-indigo-300" />
        <p className="text-sm font-medium text-slate-500">
          Loading SnapCart...
        </p>
      </div>
    );
  }

  // Only render routes once we know if the user is authenticated or not
  return <>{children}</>;
};
