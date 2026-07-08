import { Request, Response } from "express";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
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
      "name email sellerStatus sellerApplication createdAt",
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
    // 1. KPI Stats
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    const totalOrders = await Order.countDocuments();

    const avgOrderAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, avg: { $avg: "$totalPrice" } } },
    ]);
    const avgOrderValue = avgOrderAgg[0]?.avg ?? 0;

    const lowStockCount = await Product.countDocuments({
      isActive: true,
      stock: { $lt: 10 },
    });

    // 2. 14-Day Revenue Chart Data
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenueAgg = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days
    const dailyRevenue: Array<{
      date: string;
      revenue: number;
      orders: number;
    }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split("T")[0];
      const match = dailyRevenueAgg.find((r) => r._id === dateStr);
      dailyRevenue.push({
        date: dateStr,
        revenue: match ? match.revenue : 0,
        orders: match ? match.orders : 0,
      });
    }

    // 3. Top Products by Quantity
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);

    // 4. Order Status Distribution (Donut Chart)
    const orderStatusAgg = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const orderStatuses = orderStatusAgg.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    // 5. Revenue by Category (Pie Chart)
    const revenueByCategory = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const categoriesData = revenueByCategory.map((c) => ({
      category: c._id,
      revenue: c.revenue,
    }));

    res.status(200).json(
      new ApiResponse(200, "Analytics fetched successfully", {
        kpis: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          lowStockCount,
        },
        dailyRevenue,
        topProducts,
        orderStatuses,
        revenueByCategory: categoriesData,
      }),
    );
  },
);
