// GET /products           — paginated list with filters + search
// GET /products/:id       — single product detail
// POST /products          — seller creates product (FormData / multipart)
// PATCH /products/:id     — seller edits product (FormData / multipart)
// DELETE /products/:id    — seller soft-deletes product

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  createProductApi,
  deleteProductApi,
  getProductByIdApi,
  getProductsApi,
  updateProductApi,
} from "@/api/product.api";
import { getApiErrorMessage } from "@/types/api.types";

import type {
  ProductFormData,
  ProductQueryParams,
} from "@/types/product.types";

export const productKeys = {
  all: ["products"] as const,
  list: (params: ProductQueryParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

// GET /products — paginated list with filters
export function useProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const res = await getProductsApi(params);
      // res.data.data = { products: Product[], pagination: { total, page, ... } }
      return res.data.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });
}

// GET /products/:id — single product detail
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await getProductByIdApi(id!); // ← correct name
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

// POST /products — FormData conversion handled inside createProductApi
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ProductFormData) => createProductApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product created!");
      navigate("/seller/products");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to create product."));
    },
  });
}

// PATCH /products/:id — partial update, image optional
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: Partial<ProductFormData>) => updateProductApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product updated!");
      navigate("/seller/products");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to update product."));
    },
  });
}

// DELETE /products/:id — soft delete (backend sets isActive: false)
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product deleted.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to delete product."));
    },
  });
}
