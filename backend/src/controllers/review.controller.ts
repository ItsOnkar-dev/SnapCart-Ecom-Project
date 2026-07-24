import { Request, Response } from "express";
import { Product } from "../models/product.model";
import { Review } from "../models/review.model";
import {
  createReviewService,
  deleteReviewService,
} from "../services/review.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildPaginationResult, getPaginationParams } from "../utils/pagination";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    return value;
  }

  throw new ApiError(400, "Invalid request");
};

// POST /api/reviews/:productId
// Only customers who actually ordered the product can review it
export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getRouteParam(req.params.productId, "product id");
    const { rating, title, comment } = req.body;

    const review = await createReviewService(
      req.user!._id,
      productId,
      rating,
      title,
      comment,
    );

    res
      .status(201)
      .json(new ApiResponse(201, "Review submitted successfully", review));
  },
);

// GET /api/reviews/:productId
// Public — anyone can read reviews
export const getProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    // Check product exists first
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found");
    }

    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string },
      { limit: 20, maxLimit: 100 },
    );

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ product: productId }),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Reviews fetched successfully", {
        totalReviews: total,
        reviews,
        pagination: buildPaginationResult(total, { page, limit, skip }),
      }),
    );
  },
);

// DELETE /api/reviews/:id
// Customer can delete their own review
export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    const reviewId = getRouteParam(req.params.id, "review id");
    await deleteReviewService(req.user!._id, reviewId);

    res.status(200).json(new ApiResponse(200, "Review deleted successfully"));
  },
);
