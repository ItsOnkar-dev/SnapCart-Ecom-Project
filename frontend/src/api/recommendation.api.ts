import { api } from "@/lib/axios";

export interface GetRecommendationsParams {
  mode: "product" | "cart";
  productIds: string[];
  limit?: number;
}

export const getRecommendationsApi = (params: GetRecommendationsParams) =>
  api.get("/products/recommendations", {
    params: {
      mode: params.mode,
      productIds: params.productIds.join(","),
      limit: params.limit ?? 4,
    },
  });
