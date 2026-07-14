// ── category type — mirrors the enum in your mongoose schema exactly.
export type ProductCategory =
  | "All Products"
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "sports"
  | "books"
  | "gaming"
  | "new in";
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: ProductCategory;
  images: string[]; // string[] not ProductImage[] — backend stores URLs directly
  averageRating: number;
  totalReviews: number;
  stock: number;
  seller: {
    // populated from User ref when backend sends it
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface PaginatedProducts {
  products: Product[];
  pagination: {
    // ← was flat before, now correctly nested
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: ProductCategory;
  image: File;
}

export type ProductSort = "price_asc" | "price_desc" | "newest" | "rating";

// ── query params for GET /api/products ───────────────────────────────────────
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  inStock?: boolean;
}
