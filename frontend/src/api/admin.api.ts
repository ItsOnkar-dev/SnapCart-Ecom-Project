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

// PATCH /api/admin/products/:id — admin edits any product
export const updateAdminProductApi = (id: string, body: FormData) =>
  api.patch(`/admin/products/${id}`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// PATCH /api/admin/products/:id/status — toggle isActive
export const toggleAdminProductStatusApi = (id: string, isActive: boolean) =>
  api.patch(`/admin/products/${id}/status`, { isActive });

// DELETE /api/admin/products/:id — hard delete
