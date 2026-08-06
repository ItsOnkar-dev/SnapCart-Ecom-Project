import { Request, Response } from "express";
import { Coupon } from "../models/coupon.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, "Coupons fetched successfully", coupons));
});

export const getCouponById = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(200).json(new ApiResponse(200, "Coupon fetched successfully", coupon));
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, discountType, discountValue, minimumOrder, maxDiscount, usageLimit, expiresAt } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) throw new ApiError(400, "A coupon with this code already exists");

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    minimumOrder: minimumOrder ?? 0,
    maxDiscount: maxDiscount ?? 0,
    usageLimit: usageLimit ?? 0,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  res.status(201).json(new ApiResponse(201, "Coupon created successfully", coupon));
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(200).json(new ApiResponse(200, "Coupon updated successfully", coupon));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(200).json(new ApiResponse(200, "Coupon deleted successfully"));
});
