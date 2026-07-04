import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types/user.types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

// sits inside a ProtectedRoute — user is guaranteed to exist here
// redirects to /unauthorized if the user's role isn't in allowedRoles
const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
