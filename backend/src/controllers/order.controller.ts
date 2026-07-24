import { Request, Response } from "express";
import mongoose from "mongoose";
import { Order } from "../models/order.model";
import {
  placeOrderService,
  restoreStockService,
} from "../services/order.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { invalidateAnalyticsCache } from "../utils/analyticsCache";
import { buildPaginationResult, getPaginationParams } from "../utils/pagination";

// POST /api/orders
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress } = req.body;

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.phone ||
    !shippingAddress?.street ||
    !shippingAddress?.city ||
    !shippingAddress?.state ||
    !shippingAddress?.pincode
  ) {
    throw new ApiError(400, "Complete shipping address is required");
  }

  const order = await placeOrderService(req.user!._id, shippingAddress, {
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "pending",
  });
  res
    .status(201)
    .json(new ApiResponse(201, "Order placed successfully", order));
});

// GET /api/orders
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPaginationParams(
    req.query as { page?: string; limit?: string },
    { limit: 10, maxLimit: 50 },
  );

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .select("-__v")
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: req.user!._id }),
  ]);

  if (orders.length === 0) {
    res.status(200).json(new ApiResponse(200, "You have no orders yet", { orders: [], pagination: buildPaginationResult(0, { page, limit, skip }) }));
    return;
  }

  res.status(200).json(
    new ApiResponse(200, "Orders fetched successfully", {
      orders,
      pagination: buildPaginationResult(total, { page, limit, skip }),
    }),
  );
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);

    if (!order) throw new ApiError(404, "Order not found");

    if (order.user.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "You are not authorized to view this order");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Order fetched successfully", order));
  },
);

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

// PATCH /api/orders/:id/status
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body as { status: OrderStatus };

    if (!status || !ORDER_STATUSES.includes(status)) {
      throw new ApiError(400, "Invalid order status");
    }

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    const currentIndex = ORDER_STATUSES.indexOf(order.status as OrderStatus);
    const newIndex = ORDER_STATUSES.indexOf(status);

    if (newIndex < currentIndex && status !== "cancelled") {
      throw new ApiError(400, "Order status cannot be changed in this way");
    }

    if (status === "cancelled" && order.status !== "delivered") {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await restoreStockService(order._id, session);
        order.status = status;
        if (order.paymentStatus === "paid") {
          order.paymentStatus = "refund_pending";
        }
        await order.save({ session });
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        await session.endSession();
      }
    } else {
      order.status = status;
      await order.save();
    }

    invalidateAnalyticsCache();

    res
      .status(200)
      .json(new ApiResponse(200, `Order status updated to "${status}"`, order));
  },
);
