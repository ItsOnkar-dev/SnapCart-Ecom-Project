import { Request, Response } from "express";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/orders
// Place an order from current cart
export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddress } = req.body;

  // Step 1 — Validate shipping address
  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.street ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.pincode
  ) {
    throw new ApiError(400, "Complete shipping address is required");
  }

  // Step 2 — Get customer's cart
  const cart = await Cart.findOne({ user: req.user!._id }).populate(
    "items.product",
  );

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // Step 3 — Validate every item in cart before placing order
  // Products might have gone out of stock since they were added
  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product || !product.isActive) {
      throw new ApiError(400, `Product is no longer available`);
    }

    if (product.stock < item.quantity) {
      throw new ApiError(
        400,
        `Only ${product.stock} units of "${product.name}" are available`,
      );
    }
  }

  // Step 4 — Build order items as snapshots
  // We copy name, price, image so order history is accurate forever
  // even if seller edits or deletes the product later
  const orderItems = cart.items.map((item) => {
    const product = item.product as any; // populated product document
    return {
      product: product._id,
      name: product.name, // snapshot
      price: item.price, // snapshot (price when added to cart)
      quantity: item.quantity,
      image: product.images?.[0] || "", // snapshot of first image
    };
  });

  // Step 5 — Create the order
  const order = await Order.create({
    user: req.user!._id,
    items: orderItems,
    shippingAddress,
    totalPrice: cart.totalPrice,
    status: "pending",
  });

  // Step 6 — Decrease stock for every product ordered
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }, // decrement stock by quantity ordered
    });
  }

  // Step 7 — Clear the cart after successful order
  cart.items = [] as typeof cart.items;
  cart.totalPrice = 0;
  await cart.save();

  res
    .status(201)
    .json(new ApiResponse(201, "Order placed successfully", order));
});

// GET /api/orders
// Get all orders for current logged in customer
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!._id })
    .sort({ createdAt: -1 }) // newest first
    .select("-__v"); // hide mongoose version key

  if (orders.length === 0) {
    res.status(200).json(new ApiResponse(200, "You have no orders yet", []));
    return;
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Orders fetched successfully", orders));
});

// GET /api/orders/:id
// Get single order detail — only the owner can see it
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Make sure this order belongs to the logged in user
    if (order.user.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "You are not authorized to view this order");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Order fetched successfully", order));
  },
);

// PATCH /api/orders/:id/status
// Admin or seller updates order status
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.body;

    // Step 1 — Validate status value
    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(
        400,
        `Status must be one of: ${validStatuses.join(", ")}`,
      );
    }

    // Step 2 — Find the order
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Step 3 — Prevent going backwards in status
    // Example: can't move from "delivered" back to "pending"
    const statusFlow = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const currentIndex = statusFlow.indexOf(order.status);
    const newIndex = statusFlow.indexOf(status);

    if (newIndex < currentIndex && status !== "cancelled") {
      throw new ApiError(
        400,
        `Cannot move order status from "${order.status}" to "${status}"`,
      );
    }

    // Step 4 — If cancelling a non-delivered order, restore stock
    if (status === "cancelled" && order.status !== "delivered") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }, // give stock back
        });
      }
    }

    // Step 5 — Update status
    order.status = status;
    await order.save();

    res
      .status(200)
      .json(new ApiResponse(200, `Order status updated to "${status}"`, order));
  },
);
