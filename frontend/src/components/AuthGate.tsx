import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useAuthStore } from "../store/auth.store";

export const AuthGate = () => {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    initAuth();

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [initAuth]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex gap-4 items-center justify-center">
        <div className="flex flex-col items-center justify-center animate-pulse text-center duration-1000">
          {/* <Logo /> */}
          <div className="flex items-center gap-2 text-lg md:text-xl font-bold ">
            <p className="text-foreground">Loading</p>
            <p className="text-indigo-400">SnapCart</p>
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
          {minTimeElapsed && (
            <p className="mt-2 text-sm font-semibold text-muted-foreground animate-pulse max-w-sm">
              Getting the storefront ready! Connecting to our backend systems
              usually takes 4-6 seconds. Hang tight!
            </p>
          )}
        </div>
      </div>
    );
  }

  // Once loading is finished, render the current route via Outlet
  return <Outlet />;
};
