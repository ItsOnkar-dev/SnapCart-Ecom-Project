import mongoose, { Schema } from "mongoose";
import { IProduct } from "../types/product.types";

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      // we'll validate discountPrice < price in the controller
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "All Products",
        "electronics",
        "fashion",
        "home",
        "beauty",
        "sports",
        "books",
        "gaming",
        "new in",
      ],
    },
    images: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User", // links to User model — lets us do .populate("seller")
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ name: "text" });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ isActive: 1, seller: 1 });

export const Product = mongoose.model<IProduct>("Product", productSchema);
