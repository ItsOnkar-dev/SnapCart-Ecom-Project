import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/admin/sellers
// Admin sees all users who have applied to become sellers
export const getPendingSellers = asyncHandler(
  async (req: Request, res: Response) => {
    const pendingSellers = await User.find({ sellerStatus: "pending" }).select(
      "name email sellerStatus createdAt",
      // only return what admin needs — no passwords, no tokens
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, "Pending seller applications", pendingSellers),
      );
  },
);

// PATCH /api/admin/sellers/:id
// Admin approves or rejects a seller application
export const updateSellerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params; // seller's user ID from URL
    const { status } = req.body; // "approved" or "rejected"

    // Step 1 — Validate the status value
    if (!["approved", "rejected"].includes(status)) {
      throw new ApiError(400, "Status must be either 'approved' or 'rejected'");
    }

    // Step 2 — Find the user
    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Step 3 — Make sure they actually applied
    if (user.sellerStatus !== "pending") {
      throw new ApiError(400, "This user does not have a pending application");
    }

    // Step 4 — If approved, upgrade their role to seller
    //          If rejected, keep them as customer
    user.sellerStatus = status;
    if (status === "approved") {
      user.role = "seller"; // now they can create products
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json(
      new ApiResponse(200, `Seller application ${status}`, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sellerStatus: user.sellerStatus,
      }),
    );
  },
);
