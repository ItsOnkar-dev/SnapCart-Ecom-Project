import { api } from "@/lib/axios";

// GET /api/admin/dashboard — fetches top-level KPIs (Revenue, Orders, Low Stock)
export const getAdminDashboardMetricsApi = () => api.get("/admin/dashboard");

// GET /api/admin/analytics — fetches chart data (14-day revenue, category distribution)
export const getAdminAnalyticsApi = () => api.get("/admin/analytics");

// Note: Your pending seller APIs (getPendingSellersApi, updateSellerStatusApi)
// are currently living in seller.api.ts. That is completely fine to leave as-is!
