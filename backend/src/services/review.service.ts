import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Review } from "../models/review.model";

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
  const average = Math.round((sum / reviews.length) * 10) / 10; // e.g. 4.3
  await Product.findByIdAndUpdate(productId, {
    averageRating: average,
    totalReviews: reviews.length,
  });
};
