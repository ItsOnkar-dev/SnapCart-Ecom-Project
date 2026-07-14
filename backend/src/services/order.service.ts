import mongoose, { Types } from "mongoose";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { PopulatedCartItem } from "../types/cart.types";
import { IShippingAddress } from "../types/order.types";
import { ApiError } from "../utils/ApiResponse";
import { Logger } from "../utils/logger";

export interface PlaceOrderPaymentInfo {
  paymentMethod?: "razorpay" | "cod";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: "pending" | "paid";
  status?: "pending" | "confirmed";
}

export const placeOrderService = async (
  userId: Types.ObjectId,
  shippingAddress: IShippingAddress,
  paymentInfo: PlaceOrderPaymentInfo = {},
) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  const items = cart.items as unknown as PopulatedCartItem[];

  // Shipping-total policy (single source of truth — mirrors payment.controller.ts)
  const SHIPPING_THRESHOLD = 500;
  const SHIPPING_COST = 49;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const totalPrice = subtotal + shipping;

  // Start a MongoDB session + transaction
  // All writes (order create, stock decrement, cart clear) are wrapped automatically.
  // If anything fails mid-way, every write is rolled back automatically.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Atomic stock reservation: check availability AND decrement in one operation
    for (const item of items) {
      if (!item.product || !item.product.isActive) {
        throw new ApiError(
          400,
          `A product in your cart is no longer available`,
        );
      }

      const updated = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          isActive: true,
          stock: { $gte: item.quantity }, // atomic guard — only matches if enough stock exists
        },
        { $inc: { stock: -item.quantity } },
        { new: true, session },
      );

      if (!updated) {
        // Either out of stock or product deactivated between cart add and checkout
        const latest = await Product.findById(item.product._id).session(
          session,
        );
        const reason =
          !latest || !latest.isActive
            ? `"${item.product.name}" is no longer available`
            : `Only ${latest.stock} unit(s) of "${item.product.name}" are left in stock`;
        throw new ApiError(400, reason);
      }
    }

    // Step 4 — Build order item list from cart items
    const orderItems = items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      image: item.product.images?.[0] ?? "",
    }));

    // Step 5 — Create the order inside the transaction (with payment metadata baked in)
    const [order] = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          shippingAddress,
          subtotal,
          shipping,
          totalPrice,
          status: paymentInfo.status ?? "pending",
          paymentMethod: paymentInfo.paymentMethod ?? "razorpay",
          paymentStatus: paymentInfo.paymentStatus ?? "pending",
          razorpayOrderId: paymentInfo.razorpayOrderId ?? null,
          razorpayPaymentId: paymentInfo.razorpayPaymentId ?? null,
        },
      ],
      { session },
    );

    // Step 6 — Clear the cart inside the transaction
    cart.items = [] as typeof cart.items;
    cart.totalPrice = 0;
    await cart.save({ session });

    // Step 7 — Commit — all three writes land atomically
    await session.commitTransaction();

    Logger.info("Order placed", { orderId: order._id, userId });

    return order;
  } catch (err) {
    // Roll back every write in this transaction
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
};

export const restoreStockService = async (
  orderId: Types.ObjectId | string,
  session?: mongoose.ClientSession,
) => {
  const order = await Order.findById(orderId).session(session ?? null);
  if (!order) throw new ApiError(404, "Order not found");

  for (const item of order.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { session },
    );
  }
};
