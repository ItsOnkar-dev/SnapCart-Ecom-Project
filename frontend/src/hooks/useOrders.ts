// hooks/useOrders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  getOrderByIdApi,
  getOrdersApi,
  placeOrderApi, // ← correct name
  updateOrderStatusApi,
} from "@/api/order.api";
import { cartKeys } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/types/api.types";

import type { OrderStatus, ShippingAddress } from "@/types/order.types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (page: number = 1) => ["orders", "list", page] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

// GET /orders
export function useOrders(page: number = 1) {
  return useQuery({
    queryKey: orderKeys.list(page),
    queryFn: async () => {
      const res = await getOrdersApi(page);
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

// GET /orders/:id
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await getOrderByIdApi(id!); // ← correct name
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export interface PlaceOrderPayload {
  shippingAddress: ShippingAddress;
  couponCode?: string;
}

// POST /orders → { shippingAddress, couponCode }
// backend handles cart validation + stock deduction in one transaction
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?._id);

  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) =>
      placeOrderApi(payload.shippingAddress, payload.couponCode),
    onSuccess: (res) => {
      const order = res.data.data;
      // Immediately set cart to empty so the nav badge updates instantly
      if (userId) {
        queryClient.setQueryData(cartKeys.cart(userId), {
          items: [],
          totalPrice: 0,
        });
        queryClient.invalidateQueries({ queryKey: cartKeys.cart(userId) });
      }
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success("Order placed!");
      navigate(`/orders/${order._id}`);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not place order."));
    },
  });
}

// PATCH /orders/:id/status → { status }
// seller + admin only
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => updateOrderStatusApi(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success("Order status updated.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update status."));
    },
  });
}
