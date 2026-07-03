// WHY THIS FILE EXISTS:
// Every component, hook, and api function that touches products
// imports from here. The shape here must mirror the mongoose schema exactly.
// If these don't match, TypeScript lies to you and bugs hide at runtime.

// ── category type — mirrors the enum in your mongoose schema exactly ──────────
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

// ── what the backend returns for a single product ─────────────────────────────
// mirrors productSchema fields exactly
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

// ── paginated response — what GET /api/products returns ──────────────────────
// verify this matches your getAllProducts controller response shape
export interface PaginatedProducts {
  products: Product[];
  pagination: {
    // ← was flat before, now correctly nested
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean; // ← backend sends these, we should type them
    hasPrevPage: boolean;
  };
}

// ── what the form collects — used by React Hook Form + Zod ───────────────────
// image is File (browser type) because multer expects multipart/form-data
// the api function converts this into FormData before sending
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: ProductCategory;
  image: File;
}

// ── query params for GET /api/products ───────────────────────────────────────
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
}
