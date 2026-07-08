import { getAdminAnalyticsApi } from "@/api/admin.api";
import { useQuery } from "@tanstack/react-query";

export const analyticsKeys = {
  admin: ["admin", "analytics"] as const,
};

export function useAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.admin,
    queryFn: async () => {
      const res = await getAdminAnalyticsApi();
      return res.data?.data ?? res.data;
    },
    staleTime: 60 * 1000, // Analytics are intensive; cache for 1 minute to save server power
  });
}
