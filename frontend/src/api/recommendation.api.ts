import { api } from "@/lib/axios";

export const getRecommendationsApi = (params?: {
  productId?: string;
  type?: string;
  limit?: number;
}) => api.get("/products/recommendations", { params });
