import { Request, Response } from "express";
import { Coupon } from "../models/coupon.model";
import { ApiResponse } from "../utils/ApiResponse";

export const applyCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { code, subtotal } = req.body as { code: string; subtotal: number };

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  if (!coupon) {
    res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
    return;
  }

  if (coupon.minimumOrder > 0 && subtotal < coupon.minimumOrder) {
    res.status(400).json({
      success: false,
      message: `Minimum order of ₹${coupon.minimumOrder} required for this coupon`,
    });
    return;
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    return;
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  const finalTotal = subtotal - discount;

  res.status(200).json(
    new ApiResponse(200, "Coupon applied successfully", {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalTotal,
    }),
  );
};
