import mongoose, { Schema } from "mongoose";

export interface ICoupon {
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minimumOrder: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },
    minimumOrder: {
      type: Number,
      default: 0,
      min: [0, "Minimum order cannot be negative"],
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: [0, "Max discount cannot be negative"],
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: [0, "Usage limit cannot be negative"],
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
