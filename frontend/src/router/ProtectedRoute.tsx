import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth.store";

// renders children if authenticated, otherwise redirects to /login
// preserves the attempted URL so we can redirect back after login
const ProtectedRoute = () => {
  const { user, isAuthLoading } = useAuthStore();
  const location = useLocation();

  // still resolving the boot /me call — render nothing to avoid flash
  if (isAuthLoading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
