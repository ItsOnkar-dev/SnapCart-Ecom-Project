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
      default: null,
      validate: {
        validator: function (value: number | null) {
          if (value === null || value === undefined) return true;
          return typeof value === "number" && value >= 0;
        },
        message: "Discount price must be a valid positive number",
      },
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
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    highlights: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 6,
        message: "Maximum 6 highlights allowed",
      },
    },
    shippingInfo: {
      type: String,
      trim: true,
      maxlength: [300, "Shipping info cannot exceed 300 characters"],
      default: "",
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
productSchema.index({ name: "text", description: "text" });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ isActive: 1, seller: 1 });

export const Product = mongoose.model<IProduct>("Product", productSchema);
