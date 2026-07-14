import AuthLayout from "@/components/layout/AuthLayout";
import Header from "@/components/layout/header/Header";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import Footer from "./components/layout/Footer";
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
const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductsPage = lazy(() => import("@/pages/product/ProductsPage"));
const ProductDetailPage = lazy(
  () => import("@/pages/product/ProductDetailPage"),
);
const WishlistSharePage = lazy(
  () => import("@/pages/wishlist/WishlistSharePage"),
);

// ── protected buyer pages ─────────────────────────────────────────────────────
const CartPage = lazy(() => import("@/pages/cart/CartPage"));
const OrdersPage = lazy(() => import("@/pages/order/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/order/OrderDetailPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const WishlistPage = lazy(() => import("@/pages/wishlist/WishlistPage"));
const PaymentSuccess = lazy(() => import("@/pages/payment/PaymentSuccess"));
const Unauthorized = lazy(() => import("@/pages/error/Unauthorized"));
const NotFound = lazy(() => import("@/pages/error/NotFound"));

// ── seller pages ──────────────────────────────────────────────────────────────
// const SellerDashboardPage = lazy(() => import("@/pages/seller/SellerDashboardPage"));
const SellerApplyPage = lazy(() => import("@/pages/seller/SellerApplyPage"));
const SellerProductsPage = lazy(
  () => import("@/pages/seller/SellerProductsPage"),
);

// ── admin pages ───────────────────────────────────────────────────────────────
const AdminSellersPage = lazy(() => import("@/pages/admin/AdminSellersPage"));
const AdminAnalyticsDashboard = lazy(
  () => import("@/pages/admin/AdminAnalyticsDashboard"),
);
const ReviewSellerRedirect = lazy(
  () => import("@/pages/admin/ReviewSellerRedirect"),
);

// ── layout wrapper — Header + page content via Outlet ────────────────────────
function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },

  // ── everything else gets the Header ───────────────────────────────────────
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/wishlist/share/:shareId",
        element: <WishlistSharePage />,
      },
      {
        path: "/admin/review-seller",
        element: <ReviewSellerRedirect />,
      },
      { path: "/products", element: <ProductsPage /> },
      { path: "/products/:id", element: <ProductDetailPage /> },
      { path: "/unauthorized", element: <Unauthorized /> },
      { path: "*", element: <NotFound /> },

      // ── protected: any authenticated user ───────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/cart", element: <CartPage /> },
          { path: "/payment-success", element: <PaymentSuccess /> },
          { path: "/orders", element: <OrdersPage /> },
          { path: "/orders/:id", element: <OrderDetailPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/account", element: <ProfilePage /> },
          { path: "/seller/apply", element: <SellerApplyPage /> },
          { path: "/sell", element: <SellerApplyPage /> },
          {
            path: "/wishlist",
            element: <WishlistPage />,
          },

          {
            element: <RoleRoute allowedRoles={["seller", "admin"]} />,
            children: [
              // { path: "/seller/dashboard", element: <SellerDashboardPage /> },
              { path: "/seller/products", element: <SellerProductsPage /> },
            ],
          },

          {
            element: <RoleRoute allowedRoles={["admin"]} />,
            children: [
              { path: "/admin/sellers", element: <AdminSellersPage /> },
              {
                path: "/admin/analytics",
                element: <AdminAnalyticsDashboard />,
              },
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
