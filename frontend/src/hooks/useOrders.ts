// hooks/useOrders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  getOrderByIdApi,
  getOrdersApi,
  placeOrderApi, // ← correct name
  updateOrderStatusApi,
} from "@/api/order.api";
import { cartKeys } from "@/hooks/useCart";
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

// POST /orders → { shippingAddress }
// backend handles cart validation + stock deduction in one transaction
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (shippingAddress: ShippingAddress) =>
      placeOrderApi(shippingAddress),
    onSuccess: (res) => {
      const order = res.data.data;
      // Immediately set cart to empty so the nav badge updates instantly
      queryClient.setQueryData(cartKeys.cart, { items: [], totalPrice: 0 });
      queryClient.invalidateQueries({ queryKey: cartKeys.cart });
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
export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatusApi(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success("Order status updated.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update status."));
    },
  });
}
