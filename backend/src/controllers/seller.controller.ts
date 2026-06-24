import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/seller/apply
// Only customers can apply — sellers and admins already have elevated roles
export const applyForSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;

    // Step 1 — Only customers can apply
    if (user.role !== "customer") {
      throw new ApiError(400, "Only customers can apply to become a seller");
    }

    // Step 2 — Check if already applied
    if (user.sellerStatus === "pending") {
      throw new ApiError(400, "Your application is already under review");
    }

    if (user.sellerStatus === "approved") {
      throw new ApiError(400, "You are already an approved seller");
    }

    // Step 3 — Update sellerStatus to pending
    // Admin will review this and approve or reject
    await User.findByIdAndUpdate(user._id, {
      sellerStatus: "pending",
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Seller application submitted successfully"));
  },
);
