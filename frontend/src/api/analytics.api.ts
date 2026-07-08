import { api } from "@/lib/axios";

export const getAnalyticsApi = () => api.get("/admin/analytics");
