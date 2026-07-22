import { Request, Response } from "express";
import { applyForSellerService } from "../services/seller.service";
import { Product } from "../models/product.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLog } from "../utils/auditLogger";
import { Logger } from "../utils/logger";
import { sendSellerApplicationEmail } from "../utils/sendSellerApplicationEmail";
import { buildPaginationResult, getPaginationParams } from "../utils/pagination";

// POST /api/seller/apply
// Only customers can apply — sellers and admins already have elevated roles
export const applyForSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const {
      storeName,
      contactEmail,
      contactPhone,
      taxId,
      businessAddress,
      storeDescription,
    } = req.body;

    if (!storeName || !contactEmail) {
      throw new ApiError(400, "Store name and contact email are required");
    }

    const applicant = await applyForSellerService(user, {
      storeName: storeName.trim(),
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone?.trim(),
      taxId: taxId?.trim(),
      businessAddress: businessAddress?.trim(),
      storeDescription: storeDescription?.trim(),
    });

    auditLog("seller.apply", user._id.toString(), { email: user.email });

    // notify admin — wrapped in try/catch so a Resend failure
    try {
      await sendSellerApplicationEmail(applicant ?? user);
    } catch (err) {
      Logger.error("Failed to send seller application email:", err);
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Seller application submitted successfully"));
  },
);

export const getSellerProducts = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.user?._id;

  if (!sellerId) {
    throw new ApiError(401, "Unauthorized access");
  }

  const { page, limit, skip } = getPaginationParams(
    req.query as { page?: string; limit?: string },
    { limit: 20, maxLimit: 100 },
  );

  const [products, total] = await Promise.all([
    Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments({ seller: sellerId }),
  ]);

  res.status(200).json(
    new ApiResponse(200, "Seller products fetched successfully", {
      count: total,
      products,
      pagination: buildPaginationResult(total, { page, limit, skip }),
    })
  );
});
