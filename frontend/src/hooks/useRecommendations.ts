import { getRecommendationsApi } from "@/api/recommendation.api";
import type { Product } from "@/types/product.types";
import { useQuery } from "@tanstack/react-query";

export interface RecommendationProduct extends Product {
  reason: string;
}

interface UseRecommendationsArgs {
  mode: "product" | "cart";
  productIds: string[];
  limit?: number;
  enabled?: boolean;
}

export function useRecommendations({
  mode,
  productIds,
  limit = 4,
  enabled = true,
}: UseRecommendationsArgs) {
  const stableKey = [...productIds].sort().join(",");

  return useQuery<RecommendationProduct[]>({
    queryKey: ["recommendations", mode, stableKey, limit],
    enabled: enabled && productIds.length > 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const res = await getRecommendationsApi({ mode, productIds, limit });
      return (res.data?.data as RecommendationProduct[]) ?? [];
    },
  });
}
