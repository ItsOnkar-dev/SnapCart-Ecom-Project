import { Request, Response } from "express";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { updateSellerStatusService } from "../services/seller.service";
import { getAnalyticsData } from "../utils/analyticsCache";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLog } from "../utils/auditLogger";
import {
  buildPaginationResult,
  getPaginationParams,
} from "../utils/pagination";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

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
      throw new ApiError(400, "Seller not found");
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

// PATCH /api/admin/products/:id — admin edits any product (no ownership check)
export const updateAdminProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.category) product.category = req.body.category;
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    if (req.body.discountPrice !== undefined) {
      product.discountPrice =
        req.body.discountPrice === "" || req.body.discountPrice === "0"
          ? undefined
          : Number(req.body.discountPrice);
    }

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer);
      product.images[0] = uploaded.secure_url;
    }

    await product.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Product updated successfully", product));
  },
);

// DELETE /api/admin/products/:id — hard delete, permanent
export const adminDeleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true, runValidators: true },
    ).populate("seller", "name email");

    if (!product) throw new ApiError(404, "Product not found");

    res
      .status(200)
      .json(new ApiResponse(200, "Product archived successfully", product));
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
    res
      .status(200)
      .json(new ApiResponse(200, "Analytics fetched successfully", data));
  },
);

// GET /api/admin/orders
// Admin sees ALL orders across all users with pagination
export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string },
      { limit: 10, maxLimit: 50 },
    );

    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .populate("user", "name email")
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);

    res.status(200).json(
      new ApiResponse(200, "All orders fetched successfully", {
        orders,
        pagination: buildPaginationResult(total, { page, limit, skip }),
      }),
    );
  },
);

// GET /api/admin/products
// Admin catalog controls â€” all products, including inactive soft-deleted records.
export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(
      req.query as { page?: string; limit?: string },
      {
        limit: 10,
        maxLimit: 50,
      },
    );

    const [products, total] = await Promise.all([
      Product.find({})
        .populate("seller", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Product.countDocuments({}),
    ]);

    res.status(200).json(
      new ApiResponse(200, "All products fetched successfully", {
        products,
        pagination: buildPaginationResult(total, {
          page,
          limit,
          skip,
        }),
      }),
    );
  },
);

// GET /api/admin/products/count
// Admin sees total active product count
export const getAllProductsCount = asyncHandler(
  async (req: Request, res: Response) => {
    const count = await Product.countDocuments({ isActive: true });
    res
      .status(200)
      .json(new ApiResponse(200, "Product count fetched", { count }));
  },
);
