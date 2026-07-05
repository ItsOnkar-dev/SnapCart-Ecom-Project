// AppRouter.tsx
// Header wraps every route via a layout component.
// Auth pages don't show Header — cleaner full-screen forms, matches
// what LoginPage/RegisterPage already look like (centered card, no nav).

import Header from "@/components/header/Header";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import ProtectedRoute from "./router/ProtectedRoute";
import RoleRoute from "./router/RoleRoute";

// ── auth pages ────────────────────────────────────────────────────────────────
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const ForgotPasswordPage = lazy(
  () => import("@/pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

// ── public pages ──────────────────────────────────────────────────────────────
// const HomePage = lazy(() => import("@/pages/HomePage"));
// const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
// const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));

// ── utility pages ─────────────────────────────────────────────────────────────
// const NotFound = lazy(() => import("@/pages/NotFound"));
// const Unauthorized = lazy(() => import("@/pages/Unauthorized"));

// ── protected buyer pages ─────────────────────────────────────────────────────
// const CartPage = lazy(() => import("@/pages/buyer/CartPage"));
// const OrdersPage = lazy(() => import("@/pages/buyer/OrdersPage"));
// const OrderDetailPage = lazy(() => import("@/pages/buyer/OrderDetailPage"));
// const SellerApplyPage = lazy(() => import("@/pages/buyer/SellerApplyPage"));

// ── seller pages ──────────────────────────────────────────────────────────────
// const SellerDashboardPage = lazy(() => import("@/pages/seller/SellerDashboardPage"));
// const SellerProductsPage = lazy(() => import("@/pages/seller/SellerProductsPage"));
// const CreateProductPage = lazy(() => import("@/pages/seller/CreateProductPage"));
// const EditProductPage = lazy(() => import("@/pages/seller/EditProductPage"));

// ── admin pages ───────────────────────────────────────────────────────────────
// const AdminSellersPage = lazy(() => import("@/pages/admin/AdminSellersPage"));

// ── layout wrapper — Header + page content via Outlet ────────────────────────
function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  // ── auth routes — no Header, full-screen centered forms ──────────────────
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },

  // ── everything else gets the Header ───────────────────────────────────────
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: (
          <div className="p-8 text-xl font-bold">
            SnapCart Home — coming soon
          </div>
        ),
      },
      // { path: "/products", element: <ProductsPage /> },
      // { path: "/products/:id", element: <ProductDetailPage /> },
      // { path: "/unauthorized", element: <Unauthorized /> },
      // { path: "*", element: <NotFound /> },

      // ── protected: any authenticated user ───────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          // { path: "/cart", element: <CartPage /> },
          // { path: "/orders", element: <OrdersPage /> },
          // { path: "/orders/:id", element: <OrderDetailPage /> },
          // { path: "/seller/apply", element: <SellerApplyPage /> },

          {
            element: <RoleRoute allowedRoles={["seller", "admin"]} />,
            children: [
              // { path: "/seller/dashboard", element: <SellerDashboardPage /> },
              // { path: "/seller/products", element: <SellerProductsPage /> },
              // { path: "/seller/products/new", element: <CreateProductPage /> },
              // { path: "/seller/products/:id/edit", element: <EditProductPage /> },
            ],
          },

          {
            element: <RoleRoute allowedRoles={["admin"]} />,
            children: [
              // { path: "/admin/sellers", element: <AdminSellersPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

const AppRouter = () => (
  <Suspense fallback={null}>
    <RouterProvider router={router} />
  </Suspense>
);

export default AppRouter;
