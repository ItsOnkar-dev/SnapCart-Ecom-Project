import { Request, Response } from "express";
import mongoose from "mongoose";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { placeOrderService } from "../services/order.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

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

  const order = await placeOrderService(req.user!._id, shippingAddress);
  res
    .status(201)
    .json(new ApiResponse(201, "Order placed successfully", order));
});

// GET /api/orders
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!._id })
    .sort({ createdAt: -1 })
    .select("-__v");

  if (orders.length === 0) {
    res.status(200).json(new ApiResponse(200, "You have no orders yet", []));
    return;
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Orders fetched successfully", orders));
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
      throw new ApiError(
        400,
        `Status must be one of: ${ORDER_STATUSES.join(", ")}`,
      );
    }

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    const currentIndex = ORDER_STATUSES.indexOf(order.status as OrderStatus);
    const newIndex = ORDER_STATUSES.indexOf(status);

    if (newIndex < currentIndex && status !== "cancelled") {
      throw new ApiError(
        400,
        `Cannot move order from "${order.status}" to "${status}"`,
      );
    }

    if (status === "cancelled" && order.status !== "delivered") {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
        order.status = status;
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

    res
      .status(200)
      .json(new ApiResponse(200, `Order status updated to "${status}"`, order));
  },
);
