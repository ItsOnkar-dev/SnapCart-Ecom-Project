import { useAuthStore } from "@/store/auth.store";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function ReviewSellerRedirect() {
  const { user, isAuthLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoading) return;

    // Not logged in
    if (!user) {
      navigate("/login", {
        replace: true,
        state: { from: "/admin/sellers" },
      });
      return;
    }

    // Logged in but not admin
    if (user.role !== "admin") {
      navigate("/login", {
        replace: true,
        state: {
          message: "Please sign in with an administrator account.",
        },
      });
      return;
    }

    // Logged in as admin
    navigate("/admin/sellers", { replace: true });
  }, [user, isAuthLoading, navigate]);

  return null;
}
