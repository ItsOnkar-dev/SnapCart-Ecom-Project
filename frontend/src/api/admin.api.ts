import { api } from "@/lib/axios";

// GET /api/admin/dashboard — fetches top-level KPIs (Revenue, Orders, Low Stock)
export const getAdminDashboardMetricsApi = () => api.get("/admin/dashboard");

// GET /api/admin/analytics — fetches chart data (14-day revenue, category distribution)
export const getAdminAnalyticsApi = () => api.get("/admin/analytics");

// GET /api/admin/orders — fetches all orders (admin only)
export const getAdminOrdersApi = (page?: number) =>
  api.get("/admin/orders", { params: { page } });

// GET /api/admin/products — fetches all products with pagination (admin only)
export const getAdminProductsApi = (page?: number) =>
  api.get("/admin/products", { params: { page } });

// GET /api/admin/products/count — fetches total active product count
export const getAdminProductsCountApi = () => api.get("/admin/products/count");

// Note: Your pending seller APIs (getPendingSellersApi, updateSellerStatusApi)
// are currently living in seller.api.ts. That is completely fine to leave as-is!
