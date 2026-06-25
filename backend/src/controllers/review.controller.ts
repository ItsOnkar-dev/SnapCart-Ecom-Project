import { Request, Response } from "express";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Review } from "../models/review.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/reviews/:productId
// Only customers who actually ordered the product can review it
export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Step 1 — Validate input
    if (!rating || !comment) {
      throw new ApiError(400, "Rating and comment are required");
    }

    if (rating < 1 || rating > 5) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    // Step 2 — Check product exists
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found");
    }

    // Step 3 — Check if customer actually ordered this product
    // They must have a delivered order containing this product
    const hasPurchased = await Order.findOne({
      user: req.user!._id,
      status: "delivered",
      "items.product": productId, // check if productId exists inside items array
    });

    if (!hasPurchased) {
      throw new ApiError(
        403,
        "You can only review products you have purchased and received",
      );
    }

    // Step 4 — Check if already reviewed
    // The compound index on model will also catch this but better to give a clean message
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user!._id,
    });

    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    // Step 5 — Create the review
    const review = new Review({
      product: productId,
      user: req.user!._id,
      rating,
      comment,
    });
    await review.save();

    // Step 6 — Recalculate and update average rating on the product
    // Get all reviews for this product and compute fresh average
    const allReviews = await Review.find({ product: productId });
    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10, // round to 1 decimal e.g 4.3
      totalReviews: allReviews.length,
    });

    await review.populate("user", "name avatar");
    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "name avatar",
    );

    res
      .status(201)
      .json(
        new ApiResponse(201, "Review submitted successfully", populatedReview),
      );
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

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatar") // show reviewer's name and avatar
      .sort({ createdAt: -1 }); // newest reviews first

    res.status(200).json(
      new ApiResponse(200, "Reviews fetched successfully", {
        totalReviews: reviews.length,
        reviews,
      }),
    );
  },
);

// DELETE /api/reviews/:id
// Customer can delete their own review
export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Make sure this review belongs to the logged in user
    if (review.user.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "You can only delete your own reviews");
    }

    const productId = review.product;

    await review.deleteOne();

    // Recalculate average rating after deletion
    const remainingReviews = await Review.find({ product: productId });

    if (remainingReviews.length === 0) {
      // No reviews left — reset product rating
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        totalReviews: 0,
      });
    } else {
      const averageRating =
        remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
        remainingReviews.length;

      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: remainingReviews.length,
      });
    }

    res.status(200).json(new ApiResponse(200, "Review deleted successfully"));
  },
);
