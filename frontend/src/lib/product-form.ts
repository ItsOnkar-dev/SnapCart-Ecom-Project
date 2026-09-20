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
  highlights: string;
  shippingInfo: string;
}

export const initialProductFormState: ProductFormState = {
  name: "",
  description: "",
  category: "electronics",
  price: "",
  stock: "",
  discountPrice: "",
  highlights: "",
  shippingInfo: "",
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
      product.discountPrice != null ? String(product.discountPrice) : "",
    highlights: product.highlights?.join("\n") ?? "",
    shippingInfo: product.shippingInfo ?? "",
  };
}

export function buildProductFormData(
  formData: ProductFormState,
  imageFiles?: File[] | null,
) {
  const fd = new FormData();

  fd.append("name", formData.name.trim());
  fd.append("description", formData.description.trim());
  fd.append("category", formData.category);
  fd.append("price", formData.price);
  fd.append("stock", formData.stock);

  if (formData.discountPrice && formData.discountPrice.trim() !== "") {
    fd.append("discountPrice", formData.discountPrice);
  }

  const highlightLines = formData.highlights
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);
  highlightLines.forEach((h) => fd.append("highlights", h));

  fd.append("shippingInfo", formData.shippingInfo.trim());

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      fd.append("images", file);
    });
  }

  return fd;
}
