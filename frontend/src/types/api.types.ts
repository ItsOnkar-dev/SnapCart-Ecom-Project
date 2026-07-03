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


// axios rejects with an AxiosError, not your backend's JSON shape directly —
// the backend's ApiError body lives at err.response.data.
// Use this everywhere instead of typing catch blocks as ApiError.
export const getApiErrorMessage = (
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  ) {
    const response = (err as { response?: { data?: ApiError } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};