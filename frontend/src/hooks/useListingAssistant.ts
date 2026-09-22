import { api } from "@/lib/axios";
import { getApiErrorMessage } from "@/types/api.types";
import type { GeneratedListing, ListingDraftItem } from "@/types/seller.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListingDrafts() {
  return useQuery({
    queryKey: ["seller", "drafts"],
    queryFn: async (): Promise<ListingDraftItem[]> => {
      const res = await api.get("/seller/listing-assistant/drafts");
      return res.data?.data?.drafts ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useGenerateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      input: string;
      category?: string;
    }): Promise<GeneratedListing> => {
      const res = await api.post("/seller/listing-assistant/generate", payload);
      return res.data.data.listing as GeneratedListing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller", "drafts"] });
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Failed to generate listing — try again"),
      );
    },
  });
}
