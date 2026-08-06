import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCouponApi,
  deleteCouponApi,
  getCouponsApi,
  updateCouponApi,
} from "@/api/coupon.api";
import { getApiErrorMessage } from "@/types/api.types";
import type { CouponPayload } from "@/types/coupon.types";

export const couponKeys = {
  all: ["admin", "coupons"] as const,
  list: () => ["admin", "coupons", "list"] as const,
};

export function useCoupons() {
  return useQuery({
    queryKey: couponKeys.list(),
    queryFn: async () => {
      const res = await getCouponsApi();
      return res.data.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CouponPayload) => createCouponApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.list() });
      toast.success("Coupon created successfully.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not create coupon."));
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CouponPayload }) =>
      updateCouponApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.list() });
      toast.success("Coupon updated successfully.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update coupon."));
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCouponApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.list() });
      toast.success("Coupon deleted successfully.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not delete coupon."));
    },
  });
}
