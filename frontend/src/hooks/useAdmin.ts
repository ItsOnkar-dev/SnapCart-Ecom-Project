import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getAdminOrdersApi,
  getAdminProductsApi,
  getAdminProductsCountApi,
  toggleAdminProductStatusApi,
  updateAdminProductApi,
} from "@/api/admin.api";
import { getPendingSellersApi, updateSellerStatusApi } from "@/api/seller.api";
import { getApiErrorMessage } from "@/types/api.types";

import type { SellerDecisionStatus } from "@/types/seller.types";

export const adminKeys = {
  sellers: ["admin", "sellers"] as const,
  orders: ["admin", "orders"] as const,
  products: ["admin", "products"] as const,
  productsCount: ["admin", "products", "count"] as const,
};

export function useAdminSellers() {
  return useQuery({
    queryKey: adminKeys.sellers,
    queryFn: async () => {
      const res = await getPendingSellersApi();
      return res.data.data;
    },
    staleTime: 30 * 1000,
  });
}

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

export function useAdminOrders(page: number = 1, enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.orders, page],
    queryFn: async () => {
      const res = await getAdminOrdersApi(page);
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useAdminProducts(page: number = 1, enabled = true) {
  return useQuery({
    queryKey: [...adminKeys.products, page],
    queryFn: async () => {
      const res = await getAdminProductsApi(page);
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useAdminProductsCount() {
  return useQuery({
    queryKey: adminKeys.productsCount,
    queryFn: async () => {
      const res = await getAdminProductsCountApi();
      return res.data.data.count;
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      updateAdminProductApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products });
      toast.success("Product updated successfully.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update product."));
    },
  });
}

export function useToggleAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleAdminProductStatusApi(id, isActive),
    onSuccess: (_data, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products });
      queryClient.invalidateQueries({ queryKey: adminKeys.productsCount });
      toast.success(isActive ? "Product restored." : "Product removed.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update product."));
    },
  });
}
