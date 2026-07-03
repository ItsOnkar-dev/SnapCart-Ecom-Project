import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import AppRouter from "./App";
import "./index.css";
import { useAuthStore } from "./store/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min — adjust per resource
    },
  },
});

// boots initAuth once, before any route renders
const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => {
    initAuth();
  }, []);
  return <>{children}</>;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <AppRouter />
        <Toaster position="top-right" />
      </AuthGate>
    </QueryClientProvider>
  </StrictMode>,
);
