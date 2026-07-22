// WHY THIS FILE EXISTS:
// Reviews are restricted — backend only allows a review if the user
// has a delivered order containing that product.
// Frontend doesn't enforce this — it just sends the request.
// Backend enforces it. Frontend just shows the error if it comes back.

import { api } from "@/lib/axios";
import type { ReviewFormData } from "@/types/review.types";

// GET /api/reviews/:productId — public, no auth
export const getReviewsApi = (productId: string, page?: number) =>
  api.get(`/reviews/${productId}`, { params: { page } });

// POST /api/reviews/:productId — must be logged in, backend checks verified purchase
export const createReviewApi = (productId: string, body: ReviewFormData) =>
  api.post(`/reviews/${productId}`, body);

// DELETE /api/reviews/:id — own review or admin
// note: delete uses review's own _id, not productId
export const deleteReviewApi = (reviewId: string) =>
  api.delete(`/reviews/${reviewId}`);
