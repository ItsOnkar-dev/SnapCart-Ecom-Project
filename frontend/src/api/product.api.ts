// Products are read by public pages AND written by sellers.
// The same URL GET /api/products serves the homepage and the seller dashboard.

// HOW image upload works:
// Your backend uses multer — it expects multipart/form-data, not JSON.
// So createProduct and updateProduct use FormData, not a plain object.
// Axios automatically sets the correct Content-Type when you pass FormData.

import { api } from "@/lib/axios";
import type {
  ProductFormData,
  ProductQueryParams,
} from "@/types/product.types";

// ── api functions ─────────────────────────────────────────────────────────────

// GET /api/products?page=1&limit=12&search=phone&category=electronics
// axios converts the params object into ?key=value query string automatically
export const getProductsApi = (params?: ProductQueryParams) =>
  api.get("/products", { params });

// GET /api/products/:id
export const getProductByIdApi = (id: string) => api.get(`/products/${id}`);

// POST /api/products — seller only
// ProductFormData has image: File — we convert to FormData here for multer
// this conversion is transport logic — belongs in api layer, not types layer
export const createProductApi = (body: ProductFormData) => {
  const form = new FormData();
  form.append("name", body.name);
  form.append("description", body.description);
  form.append("price", String(body.price));
  form.append("stock", String(body.stock));
  form.append("category", body.category);
  if (body.discountPrice)
    form.append("discountPrice", String(body.discountPrice));
  form.append("image", body.image); // File object — multer reads this
  return api.post("/products", form);
};

// PATCH /api/products/:id — seller only, image optional on update
export const updateProductApi = (
  id: string,
  body: Partial<ProductFormData>,
) => {
  const form = new FormData();
  if (body.name) form.append("name", body.name);
  if (body.description) form.append("description", body.description);
  if (body.price) form.append("price", String(body.price));
  if (body.stock) form.append("stock", String(body.stock));
  if (body.category) form.append("category", body.category);
  if (body.discountPrice)
    form.append("discountPrice", String(body.discountPrice));
  if (body.image) form.append("image", body.image);
  return api.patch(`/products/${id}`, form);
};

// DELETE /api/products/:id — soft delete, backend sets isActive: false
export const deleteProductApi = (id: string) => api.delete(`/products/${id}`);
