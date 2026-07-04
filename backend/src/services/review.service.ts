import { Types } from "mongoose";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Review } from "../models/review.model";
import { ApiError } from "../utils/ApiResponse";

export const recalculateRating = async (
  productId: Types.ObjectId | string,
): Promise<void> => {
  const reviews = await Review.find({ product: productId });
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / reviews.length) * 10) / 10;

  await Product.findByIdAndUpdate(productId, {
    averageRating: average,
    totalReviews: reviews.length,
  });
};

export const createReviewService = async (
  userId: Types.ObjectId | string,
  productId: string,
  rating: number,
  comment?: string,
) => {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  const hasPurchased = await Order.findOne({
    user: userId,
    status: "delivered",
    "items.product": productId,
  });

  if (!hasPurchased) {
    throw new ApiError(
      403,
      "You can only review products you have purchased and received",
    );
  }

  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  const review = new Review({
    product: productId,
    user: userId,
    rating,
    comment,
  });

  await review.save();
  await recalculateRating(productId);
  await review.populate("user", "name avatar");

  return review;
};

export const deleteReviewService = async (
  userId: Types.ObjectId | string,
  reviewId: string,
) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own reviews");
  }

  const productId = review.product;
  await review.deleteOne();
  await recalculateRating(productId);

  return review;
};
