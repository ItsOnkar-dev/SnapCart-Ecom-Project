import { useQuery } from "@tanstack/react-query";
import { getAnalyticsApi } from "@/api/analytics.api";
import { useAuthStore } from "@/store/auth.store";

export const analyticsKeys = {
  analytics: ["admin", "analytics"] as const,
};

export function useAnalytics() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: analyticsKeys.analytics,
    queryFn: async () => {
      const res = await getAnalyticsApi();
      return res.data.data;
    },
    enabled: user?.role === "admin",
    staleTime: 5 * 60 * 1000,
  });
}
