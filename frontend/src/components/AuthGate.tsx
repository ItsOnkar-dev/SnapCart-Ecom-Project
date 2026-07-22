// src/components/AuthGate.tsx
import { useEffect, useState } from "react";
import { Outlet } from "react-router"; // Use "react-router" to match your router package
import { useAuthStore } from "../store/auth.store";
import { Logo } from "./home/Logo";

export const AuthGate = () => {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    initAuth();

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [initAuth]);

  if (isAuthLoading || !minTimeElapsed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse duration-1000">
          <Logo className="scale-150" />
        </div>
      </div>
    );
  }

  // Once loading is finished, render the current route via Outlet
  return <Outlet />;
};
