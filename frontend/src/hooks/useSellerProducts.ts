import { api } from "@/lib/axios";
import { getApiErrorMessage } from "@/types/api.types"; //
import type { SellerProfileData } from "@/types/seller.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── API functions ──────────────────────────────────────────────────────────────
export const getSellerProductsApi = (page?: number) =>
  api.get("/seller/products", { params: { page } });
export const getSellerOrdersApi = (status?: string, page?: number) =>
  api.get("/seller/orders", { params: { status, page } });
export const createProductApi = (body: FormData) => api.post("/products", body);
export const updateProductApi = (id: string, body: FormData) =>
  api.patch(`/products/${id}`, body);
export const deleteProductApi = (id: string) => api.delete(`/products/${id}`);

export const sellerKeys = {
  all: ["seller"] as const,
  products: (page?: number) => ["seller", "products", page ?? 1] as const,
  orders: (status?: string, page?: number) =>
    ["seller", "orders", status ?? "all", page ?? 1] as const,
};

// Hook 1: Fetch items restricted to the active logged-in seller
export function useSellerProducts(page: number = 1) {
  return useQuery({
    queryKey: sellerKeys.products(page),
    queryFn: async () => {
      const res = await getSellerProductsApi(page);
      return res.data?.data ?? { products: [], pagination: null };
    },
    staleTime: 15 * 1000,
  });
}

// Hook 2: Register a new catalog product
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.all });
      toast.success("Product registered inside marketplace database.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to create product listing."));
    },
  });
}

// Hook 3: Mutate existing product attributes
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      updateProductApi(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.all });
      toast.success("Product listing configurations optimized.");
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Failed to update product variations."),
      );
    },
  });
}

// Hook 4: Purge tracking documents
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.all });
      toast.success("Listing removed from store indexes.");
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Purge request denied by core system."),
      );
    },
  });
}

// Hook 5: Fetch orders containing seller's products
export function useSellerOrders(status?: string, page: number = 1) {
  return useQuery({
    queryKey: sellerKeys.orders(status, page),
    queryFn: async () => {
      const res = await getSellerOrdersApi(status, page);
      return res.data.data;
    },
    staleTime: 15 * 1000,
  });
}

export function useSellerProfile() {
  return useQuery({
    queryKey: ["seller", "profile"],
    queryFn: async () => {
      const res = await api.get("/seller/profile");
      return res.data.data as SellerProfileData;
    },
    staleTime: 30 * 1000,
  });
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SellerProfileData, "taxId">) => {
      const res = await api.patch("/seller/profile", data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data) {
        queryClient.setQueryData(["seller", "profile"], data.data);
      }
      queryClient.invalidateQueries({ queryKey: ["seller", "profile"] });
      toast.success("Store profile updated");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to update profile"));
    },
  });
}
