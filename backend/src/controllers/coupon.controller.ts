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

  const discount =
    coupon.discountType === "percentage"
      ? Math.min(
          Math.round((subtotal * coupon.discountValue) / 100),
          coupon.maxDiscount > 0 ? coupon.maxDiscount : Infinity,
        )
      : Math.min(coupon.discountValue, subtotal);

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
