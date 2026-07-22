import { Request, Response } from "express";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { updateSellerStatusService } from "../services/seller.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLog } from "../utils/auditLogger";
import { getAnalyticsData } from "../utils/analyticsCache";

// GET /api/admin/sellers
// Admin sees all users who have applied to become sellers
export const getPendingSellers = asyncHandler(
  async (req: Request, res: Response) => {
    const sellers = await User.find({
      sellerStatus: {
        $in: ["pending", "approved", "rejected"],
      },
    }).select("name email role sellerStatus sellerApplication createdAt");

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Seller applications fetched successfully",
          sellers,
        ),
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

export const getAdminDashboardMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    // 1. Calculate Revenue and Order count (excluding cancelled orders)
    const orderStats = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const stats = orderStats[0] || { totalRevenue: 0, totalOrders: 0 };

    // 2. Calculate Average Order Value
    const averageOrderValue =
      stats.totalOrders > 0
        ? Math.round(stats.totalRevenue / stats.totalOrders)
        : 0;

    // 3. Count Low Stock Products (3 or fewer, as per your UI)
    const lowStockCount = await Product.countDocuments({ stock: { $lte: 3 } });

    res.status(200).json(
      new ApiResponse(200, "Admin dashboard metrics fetched successfully", {
        revenue: stats.totalRevenue,
        orders: stats.totalOrders,
        averageOrder: averageOrderValue,
        lowStock: lowStockCount,
      }),
    );
  },
);

// GET /api/admin/analytics
export const getAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getAnalyticsData();
    res.status(200).json(new ApiResponse(200, "Analytics fetched successfully", data));
  },
);
