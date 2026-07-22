import type { User } from "./user.types";
import type { PaginationResult } from "./api.types";

export interface Review {
  _id: string;
  product: string;
  user: Pick<User, "_id" | "name" | "avatar">;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  comment: string;
}

export interface ReviewsResponse {
  totalReviews: number;
  reviews: Review[];
  pagination: PaginationResult;
}
