import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import ProtectedRoute from "./router/ProtectedRoute";
import RoleRoute from "./router/RoleRoute";

// const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("./pages/auth/LoginPage"));
const Register = lazy(() => import("./pages/auth/RegisterPage"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmailPage"));
// const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
// const NotFound = lazy(() => import("@/pages/NotFound"));

// ── protected buyer pages
// const Profile = lazy(() => import("@/pages/buyer/Profile"));
// const Orders = lazy(() => import("@/pages/buyer/Orders"));
// const Cart = lazy(() => import("@/pages/buyer/Cart"));

// ── seller pages
// const SellerDashboard = lazy(() => import("@/pages/seller/Dashboard"));
// const SellerProducts = lazy(() => import("@/pages/seller/Products"));

// ── admin pages
// const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
// const AdminUsers = lazy(() => import("@/pages/admin/Users"));

const router = createBrowserRouter([
  // ── public routes ─────────────────────────────────────────────────────────
  // { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  // { path: "/unauthorized", element: <Unauthorized /> },
  // { path: "*", element: <NotFound /> },

  // ── protected: any authenticated user ─────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // { path: "/profile", element: <Profile /> },
      // { path: "/orders", element: <Orders /> },
      // { path: "/cart", element: <Cart /> },

      // ── seller only ───────────────────────────────────────────────────────
      {
        element: <RoleRoute allowedRoles={["seller", "admin"]} />,
        children: [
          // { path: "/seller/dashboard", element: <SellerDashboard /> },
          // { path: "/seller/products", element: <SellerProducts /> },
        ],
      },

      // ── admin only ────────────────────────────────────────────────────────
      {
        element: <RoleRoute allowedRoles={["admin"]} />,
        children: [
          // { path: "/admin/dashboard", element: <AdminDashboard /> },
          // { path: "/admin/users", element: <AdminUsers /> },
        ],
      },
    ],
  },
]);

// Suspense wraps lazy-loaded pages — swap fallback with a real skeleton later
const AppRouter = () => (
  <Suspense fallback={null}>
    <RouterProvider router={router} />
  </Suspense>
);

export default AppRouter;
