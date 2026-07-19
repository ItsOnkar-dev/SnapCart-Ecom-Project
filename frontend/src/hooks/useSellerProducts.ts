import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Typed error shape from Axios + our API ─────────────────────────────────────
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ── API functions ──────────────────────────────────────────────────────────────
export const getSellerProductsApi = () => api.get("/seller/products");
export const createProductApi = (body: FormData) => api.post("/products", body);
export const updateProductApi = (id: string, body: FormData) =>
  api.patch(`/products/${id}`, body);
export const deleteProductApi = (id: string) => api.delete(`/products/${id}`);

export const sellerKeys = {
  products: ["seller", "products"] as const,
};

// Hook 1: Fetch items restricted to the active logged-in seller
export function useSellerProducts() {
  return useQuery({
    queryKey: sellerKeys.products,
    queryFn: async () => {
      const res = await getSellerProductsApi();
      return res.data?.data?.products ?? res.data?.data ?? [];
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
      queryClient.invalidateQueries({ queryKey: sellerKeys.products });
      toast.success("Product registered inside marketplace database.");
    },
    onError: (err: ApiError) => {
      toast.error(
        err.response?.data?.message || "Failed to create product listing.",
      );
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
      queryClient.invalidateQueries({ queryKey: sellerKeys.products });
      toast.success("Product listing configurations optimized.");
    },
    onError: (err: ApiError) => {
      toast.error(
        err.response?.data?.message || "Failed to update product variations.",
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
      queryClient.invalidateQueries({ queryKey: sellerKeys.products });
      toast.success("Listing removed from store indexes.");
    },
    onError: (err: ApiError) => {
      toast.error(
        err.response?.data?.message || "Purge request denied by core system.",
      );
    },
  });
}
