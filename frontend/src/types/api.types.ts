// standard backend success envelope
export interface ApiResponse<T> {
  success: true;
  message?: string;
  data?: T;
}

// standard backend error envelope (what axios catches)
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>; // Zod field errors from backend
}

// query params for GET /products
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
}
