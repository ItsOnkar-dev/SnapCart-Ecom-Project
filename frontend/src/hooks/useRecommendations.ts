import { useQuery } from "@tanstack/react-query";
import { getRecommendationsApi } from "@/api/recommendation.api";
import { useAuthStore } from "@/store/auth.store";

export const recommendationKeys = {
  recommendations: (params?: Record<string, any>) => ["recommendations", params] as const,
};

export function useRecommendations(params?: {
  productId?: string;
  type?: string;
  limit?: number;
}) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: recommendationKeys.recommendations(params),
    queryFn: async () => {
      const res = await getRecommendationsApi(params);
      return res.data.data;
    },
    // If personalized, reload when user logins/logouts
    staleTime: 5 * 60 * 1000,
  });
}
