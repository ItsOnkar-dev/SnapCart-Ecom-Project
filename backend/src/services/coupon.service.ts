import { Coupon } from "../models/coupon.model";
import { ApiError } from "../utils/ApiResponse";
import type { ICoupon } from "../models/coupon.model";

export interface CouponCalculationResult {
  coupon: ICoupon;
  discount: number;
  finalTotal: number;
}

export const calculateCouponDiscount = (
  coupon: ICoupon,
  subtotal: number,
): number => {
  if (coupon.discountType === "percentage") {
    const discount = Math.round((subtotal * coupon.discountValue) / 100);
    return coupon.maxDiscount > 0
      ? Math.min(discount, coupon.maxDiscount)
      : discount;
  }

  return Math.min(coupon.discountValue, subtotal);
};

export const validateCoupon = async (
  code: string,
  subtotal: number,
): Promise<CouponCalculationResult> => {
  if (!code || !code.trim()) {
    throw new ApiError(400, "Coupon code is required");
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });

  if (!coupon) {
    throw new ApiError(400, "Invalid or expired coupon code");
  }

  if (coupon.minimumOrder > 0 && subtotal < coupon.minimumOrder) {
    throw new ApiError(
      400,
      `Minimum order of ₹${coupon.minimumOrder} required for this coupon`,
    );
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  const discount = calculateCouponDiscount(coupon, subtotal);
  return {
    coupon,
    discount,
    finalTotal: Math.max(0, subtotal - discount),
  };
};

export const incrementCouponUsage = async (code: string) => {
  await Coupon.findOneAndUpdate(
    { code: code.toUpperCase() },
    { $inc: { usedCount: 1 } },
  );
};
