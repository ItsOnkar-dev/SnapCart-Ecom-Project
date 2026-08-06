// hooks/useCart.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addToCartApi,
  clearCartApi,
  getCartApi,
  removeCartItemApi,
  updateCartItemApi,
} from "@/api/cart.api";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/types/api.types";

export const cartKeys = {
  cart: (userId?: string) => ["cart", userId ?? "anonymous"] as const,
};

// GET /cart — only fires when user is logged in
export function useCart() {
  const user = useAuthStore((s) => s.user);
  const userId = user?._id;

  return useQuery({
    queryKey: cartKeys.cart(userId),
    queryFn: async () => {
      const res = await getCartApi();
      // res.data.data = { _id, user, items: CartItem[] }
      return res.data.data;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

// POST /cart/add → { productId, quantity }
// endpoint is /cart/add NOT /cart — confirmed from cart.api.ts
export function useAddToCart() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => addToCartApi(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.cart(userId) });
      toast.success("Added to cart!");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not add to cart."));
    },
  });
}

// PATCH /cart/:productId → { quantity }
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => updateCartItemApi(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.cart(userId) });
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update quantity."));
    },
  });
}

// DELETE /cart/:productId
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  return useMutation({
    mutationFn: (productId: string) => removeCartItemApi(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.cart(userId) });
      toast.success("Item removed.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not remove item."));
    },
  });
}

// DELETE /cart — wipes entire cart
// removeQueries not invalidateQueries — cart is definitively empty after this
export function useClearCart() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?._id);

  return useMutation({
    mutationFn: () => clearCartApi(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: cartKeys.cart(userId) });
      toast.success("Cart cleared.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not clear cart."));
    },
  });
}
