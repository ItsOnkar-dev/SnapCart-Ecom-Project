import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types/user.types";
import { Navigate, Outlet } from "react-router";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

// redirects to /unauthorized if the user's role isn't in allowedRoles
const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
