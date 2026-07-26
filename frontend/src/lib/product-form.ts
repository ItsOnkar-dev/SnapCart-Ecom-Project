// Lets admin and seller use the same category list and FormData rules

import type { Product, ProductCategory } from "@/types/product.types";

export const PRODUCT_CATEGORY_OPTIONS: Exclude<
  ProductCategory,
  "All Products"
>[] = [
  "electronics",
  "fashion",
  "home",
  "beauty",
  "sports",
  "books",
  "gaming",
  "new in",
];

export interface ProductFormState {
  name: string;
  description: string;
  category: Exclude<ProductCategory, "All Products">;
  price: string;
  stock: string;
  discountPrice: string;
}

export const initialProductFormState: ProductFormState = {
  name: "",
  description: "",
  category: "electronics",
  price: "",
  stock: "",
  discountPrice: "",
};

export function getProductFormState(product: Product): ProductFormState {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    category:
      product.category === "All Products" ? "electronics" : product.category,
    price: product.price !== undefined ? String(product.price) : "",
    stock: product.stock !== undefined ? String(product.stock) : "",
    discountPrice:
      product.discountPrice !== undefined ? String(product.discountPrice) : "",
  };
}

export function buildProductFormData(
  formData: ProductFormState,
  imageFile?: File | null,
) {
  const fd = new FormData();

  fd.append("name", formData.name.trim());
  fd.append("description", formData.description.trim());
  fd.append("category", formData.category);
  fd.append("price", formData.price);
  fd.append("stock", formData.stock);
  fd.append("discountPrice", formData.discountPrice);

  if (imageFile) {
    fd.append("image", imageFile);
  }

  return fd;
}
