import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useAuthStore } from "../store/auth.store";

export const AuthGate = () => {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    initAuth();

    const minTimer = setTimeout(() => setMinTimeElapsed(true), 2000);
    const slowTimer = setTimeout(() => setIsSlowConnection(true), 3000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(slowTimer);
    };
  }, []);

  // Stay on splash until BOTH auth is done AND min time has passed
  const showSplash = isAuthLoading || !minTimeElapsed;

  if (showSplash) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center gap-3 px-6">
          <div className="flex items-center gap-2 text-lg sm:text-base font-bold">
            <p className="text-foreground">Loading</p>
            <p className="text-indigo-400">SnapCart</p>
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>

          {isSlowConnection && (
            <div className="mt-2 max-w-sm space-y-1 animate-in fade-in duration-500">
              <p className="text-sm font-semibold text-muted-foreground">
                ⏳ Our backend is waking up from sleep.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Render's free tier spins down after inactivity. First load takes
                6–8 seconds — thanks for your patience!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Once loading is finished, render the current route via Outlet
  return <Outlet />;
};
