// hooks/useReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  createReviewApi,
  deleteReviewApi,
  getReviewsApi,
} from "@/api/review.api";
import { getApiErrorMessage } from "@/types/api.types";
import { productKeys } from "@/hooks/useProducts";

import type { ReviewFormData } from "@/types/review.types";

export const reviewKeys = {
  list: (productId: string) => ["reviews", productId] as const,
};

// GET /reviews/:productId — public, no auth required
export function useReviews(productId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.list(productId ?? ""),
    queryFn: async () => {
      const res = await getReviewsApi(productId!);
      // res.data.data = Review[]
      return res.data.data;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  });
}

// POST /reviews/:productId → { rating, comment }
// backend enforces verified purchase — frontend just handles the error if it comes back
export function useCreateReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewFormData) => createReviewApi(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      toast.success("Review submitted!");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not submit review."));
    },
  });
}

// DELETE /reviews/:id
// reviewId = review's own _id — NOT productId (confirmed from route map + review.api.ts)
// productId needed here only to invalidate the correct cache key
export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteReviewApi(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(productId) });
      toast.success("Review deleted.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not delete review."));
    },
  });
}
