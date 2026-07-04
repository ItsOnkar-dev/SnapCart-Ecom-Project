import { Request, Response } from "express";
import { applyForSellerService } from "../services/seller.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLog } from "../utils/auditLogger";
import { Logger } from "../utils/logger";
import { sendSellerApplicationEmail } from "../utils/sendSellerApplicationEmail";

// POST /api/seller/apply
// Only customers can apply — sellers and admins already have elevated roles
export const applyForSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;

    await applyForSellerService(user);

    auditLog("seller.apply", user._id.toString(), { email: user.email });

    // notify admin — wrapped in try/catch so a Resend failure
    try {
      await sendSellerApplicationEmail(user);
    } catch (err) {
      Logger.error("Failed to send seller application email:", err);
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Seller application submitted successfully"));
  },
);
