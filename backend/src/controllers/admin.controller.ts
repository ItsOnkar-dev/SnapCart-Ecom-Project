import { Request, Response } from "express";
import { User } from "../models/user.model";
import { updateSellerStatusService } from "../services/seller.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLog } from "../utils/auditLogger";

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

    const sellerId = Array.isArray(id)
      ? id[0]
      : typeof id === "string"
        ? id
        : "";

    if (!sellerId) {
      throw new ApiError(400, "Invalid seller id");
    }

    const user = await updateSellerStatusService(sellerId, status);

    auditLog(
      status === "approved" ? "seller.approve" : "seller.reject",
      req.user?._id?.toString(),
      {
        targetUserId: user._id.toString(),
        email: user.email,
      },
    );

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
