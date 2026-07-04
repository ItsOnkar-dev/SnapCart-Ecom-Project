// src/components/AuthGate.tsx
import { Loader2 } from "lucide-react";
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">
          Loading SnapCart...
        </p>
      </div>
    );
  }

  // Only render routes once we know if the user is authenticated or not
  return <>{children}</>;
};
