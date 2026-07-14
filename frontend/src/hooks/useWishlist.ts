import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  moveWishlistToCartApi,
  toggleWishlistShareApi,
  getSharedWishlistApi,
  emailWishlistApi,
} from "@/api/wishlist.api";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/types/api.types";
import { cartKeys } from "./useCart";

export const wishlistKeys = {
  wishlist: ["wishlist"] as const,
  sharedWishlist: (shareId: string) => ["wishlist", "share", shareId] as const,
};

export function useWishlist() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: wishlistKeys.wishlist,
    queryFn: async () => {
      const res = await getWishlistApi();
      return res.data.data;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => addToWishlistApi(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success("Added to wishlist!");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not add to wishlist."));
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => removeFromWishlistApi(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success("Removed from wishlist.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not remove item from wishlist."));
    },
  });
}

export function useMoveWishlistToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => moveWishlistToCartApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      queryClient.invalidateQueries({ queryKey: cartKeys.cart });
      toast.success("Moved all wishlist items to cart!");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not move items to cart."));
    },
  });
}

export function useToggleWishlistShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareEnabled: boolean) => toggleWishlistShareApi(shareEnabled),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      const enabled = res.data?.data?.shareEnabled;
      toast.success(`Wishlist sharing ${enabled ? "enabled" : "disabled"}.`);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not toggle sharing."));
    },
  });
}

export function useSharedWishlist(shareId: string) {
  return useQuery({
    queryKey: wishlistKeys.sharedWishlist(shareId),
    queryFn: async () => {
      const res = await getSharedWishlistApi(shareId);
      return res.data.data;
    },
    enabled: !!shareId,
    staleTime: 60 * 1000,
  });
}

export function useEmailWishlist() {
  return useMutation({
    mutationFn: (email: string) => emailWishlistApi(email),
    onSuccess: () => {
      toast.success("Wishlist sent successfully!");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not email wishlist."));
    },
  });
}
