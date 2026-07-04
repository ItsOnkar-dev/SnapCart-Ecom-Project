// GET   /admin/sellers      — list pending seller applications
// PATCH /admin/sellers/:id  — approve or reject

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getPendingSellersApi, updateSellerStatusApi } from "@/api/seller.api";
import { getApiErrorMessage } from "@/types/api.types";

import type { SellerDecisionStatus } from "@/types/seller.types";

export const adminKeys = {
  sellers: ["admin", "sellers"] as const,
};

// GET /admin/sellers
// Returns applicants with: _id, name, email, sellerStatus, createdAt
export function useAdminSellers() {
  return useQuery({
    queryKey: adminKeys.sellers,
    queryFn: async () => {
      const res = await getPendingSellersApi();
      // res.data.data = SellerApplicant[]
      return res.data.data;
    },
    staleTime: 30 * 1000, // 30s — admin needs fresher data
  });
}

// PATCH /admin/sellers/:id → { status: "approved" | "rejected" }
export function useUpdateSellerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: SellerDecisionStatus;
    }) => updateSellerStatusApi(id, status),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.sellers });
      toast.success(`Seller application ${status}.`);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update seller status."));
    },
  });
}
