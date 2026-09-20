import crypto from "crypto";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { env } from "../config/validateEnv";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import {
  incrementCouponUsage,
  validateCoupon,
} from "../services/coupon.service";
import type { IProduct } from "../types/product.types";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Logger } from "../utils/logger";

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId!,
  key_secret: env.razorpay.keySecret!,
});

async function confirmPaidOrder(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  userId?: string,
): Promise<{ _id: unknown; couponCode?: string | null; user: unknown }> {
  const existingByPaymentId = await Order.findOne({ razorpayPaymentId });
  if (existingByPaymentId) {
    if (userId && existingByPaymentId.user.toString() !== userId) {
      throw new ApiError(403, "This payment does not belong to your account");
    }
    Logger.info("[PAYMENT] Order already confirmed — idempotent return", {
      razorpayPaymentId,
      orderId: existingByPaymentId._id,
    });
    return existingByPaymentId;
  }

  const filter: Record<string, unknown> = {
    razorpayOrderId,
    paymentStatus: "pending",
    status: "pending",
  };
  if (userId) filter.user = userId;

  const order = await Order.findOneAndUpdate(
    filter,
    {
      paymentStatus: "paid",
      status: "confirmed",
      razorpayPaymentId,
    },
    { new: true },
  );

  if (!order) {
    const alreadyPaid = await Order.findOne({ razorpayOrderId });
    if (alreadyPaid) {
      Logger.info(
        "[PAYMENT] Race resolved — order was confirmed by another path",
        {
          razorpayOrderId,
          razorpayPaymentId,
        },
      );
      return alreadyPaid;
    }

    Logger.error("[PAYMENT] Pending order not found for razorpayOrderId", {
      razorpayOrderId,
      razorpayPaymentId,
      userId,
    });
    throw new ApiError(
      404,
      "Order not found or already processed. Please contact support.",
    );
  }

  if (order.couponCode) {
    await incrementCouponUsage(order.couponCode);
  }

  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });

  Logger.info("[PAYMENT] Order confirmed successfully", {
    orderId: order._id,
    razorpayPaymentId,
    userId: order.user,
  });

  return order;
}

// POST /api/payments/create-order
export const createRazorpayOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

    const { shippingAddress, couponCode } = req.body;

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

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    const SHIPPING_THRESHOLD = 500;
    const SHIPPING_COST = 49;

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product as unknown as IProduct;

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `"${product.name}" only has ${product.stock} units in stock`,
        );
      }

      const price =
        product.discountPrice && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity: item.quantity,
        image: product.images?.[0] ?? "",
      });
    }

    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    let discount = 0;
    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, subtotal);
      discount = couponResult.discount;
    }

    const total = subtotal + shipping - discount;

    const amountInPaise = Math.round(total * 100);

    const reservedProductIds: Array<{ productId: unknown; quantity: number }> =
      [];

    for (const item of cart.items) {
      const product = item.product as unknown as IProduct;

      const reserved = await Product.findOneAndUpdate(
        {
          _id: product._id,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!reserved) {
        for (const prev of reservedProductIds) {
          await Product.findByIdAndUpdate(prev.productId, {
            $inc: { stock: prev.quantity },
          });
        }
        const latest = await Product.findById(product._id);
        const reason =
          !latest || !latest.isActive
            ? `"${product.name}" is no longer available`
            : `Only ${latest.stock} unit(s) of "${product.name}" are left in stock`;
        throw new ApiError(400, reason);
      }

      reservedProductIds.push({
        productId: product._id,
        quantity: item.quantity,
      });
    }

    let razorpayOrderId: string;
    let razorpayAmount: number;
    let razorpayCurrency: string;
    try {
      const rzpOrder = (await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          userId: userId.toString(),
        },
      })) as { id: string; amount: number; currency: string };
      razorpayOrderId = rzpOrder.id;
      razorpayAmount = rzpOrder.amount;
      razorpayCurrency = rzpOrder.currency;
    } catch (err) {
      for (const prev of reservedProductIds) {
        await Product.findByIdAndUpdate(prev.productId, {
          $inc: { stock: prev.quantity },
        });
      }
      Logger.error(
        "[PAYMENT] Razorpay order creation failed — stock restored",
        {
          error: err instanceof Error ? err.message : err,
        },
      );
      throw new ApiError(502, "Payment gateway unavailable. Please try again.");
    }

    let dbOrderId: unknown;
    try {
      const dbOrder = await Order.create({
        user: userId,
        items: orderItems,
        shippingAddress,
        subtotal,
        shipping,
        discount,
        couponCode: couponCode ?? null,
        totalPrice: total,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
        status: "pending",
        razorpayOrderId,
      });
      dbOrderId = dbOrder._id;
    } catch (err) {
      for (const prev of reservedProductIds) {
        await Product.findByIdAndUpdate(prev.productId, {
          $inc: { stock: prev.quantity },
        });
      }
      Logger.error(
        "[PAYMENT] DB order save failed — stock restored, Razorpay order orphaned",
        {
          razorpayOrderId,
          error: err instanceof Error ? err.message : err,
        },
      );
      throw new ApiError(
        500,
        "Failed to save order. Please contact support if payment was deducted.",
      );
    }

    Logger.info(
      "[PAYMENT] Razorpay order created, stock reserved, pending order saved",
      {
        razorpayOrderId,
        dbOrderId,
        userId,
      },
    );

    res.status(200).json(
      new ApiResponse(200, "Razorpay order created", {
        orderId: razorpayOrderId,
        amount: razorpayAmount,
        currency: razorpayCurrency,
        keyId: env.razorpay.keyId,
        subtotal,
        shipping,
        total,
      }),
    );
  },
);

// POST /api/payments/verify
export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(400, "Payment verification information is incomplete");
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", env.razorpay.keySecret!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError(400, "Payment verification failed. Please try again.");
    }

    const order = await confirmPaidOrder(
      razorpayOrderId,
      razorpayPaymentId,
      req.user!._id.toString(),
    );

    res.status(200).json(
      new ApiResponse(201, "Payment verified and order placed successfully", {
        orderId: order._id,
        razorpayPaymentId,
      }),
    );
  },
);

// POST /api/payments/webhook
export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const webhookSecret = env.razorpay.webhookSecret;

  if (!webhookSecret) {
    Logger.error("RAZORPAY_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const razorpaySignature = req.headers["x-razorpay-signature"] as string;

  if (!razorpaySignature) {
    Logger.error("Webhook received without signature header");
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    Logger.error("Webhook signature mismatch — possible spoofed request");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  let event: {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          error_description?: string;
          [key: string]: unknown;
        };
      };
    };
    [key: string]: unknown;
  };
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    Logger.error("Webhook body is not valid JSON");
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const eventType = event?.event;
  Logger.info(`Webhook received: ${eventType}`);

  if (eventType === "payment.captured") {
    const payment = event?.payload?.payment?.entity;

    if (!payment) {
      Logger.error("Webhook payment.captured missing payload");
      res.status(200).json({ received: true });
      return;
    }

    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;

    if (!razorpayPaymentId || !razorpayOrderId) {
      Logger.error("Webhook payment.captured missing payment id or order id", {
        razorpayPaymentId,
        razorpayOrderId,
      });
      res.status(200).json({ received: true });
      return;
    }

    try {
      await confirmPaidOrder(razorpayOrderId, razorpayPaymentId);

      res.status(200).json({ received: true });
    } catch (err) {
      const isApiError = err instanceof ApiError;
      if (isApiError && err.statusCode === 404) {
        Logger.error(
          "Webhook: pending order not found — possibly orphaned Razorpay order",
          {
            razorpayOrderId,
            razorpayPaymentId,
            error: err.message,
          },
        );
        res.status(200).json({ received: true });
        return;
      }

      Logger.error("Webhook: transient error processing payment.captured", {
        razorpayPaymentId,
        razorpayOrderId,
        error: err instanceof Error ? err.message : err,
      });
      res.status(500).json({ error: "Transient error — please retry" });
    }

    return;
  }

  if (eventType === "payment.failed") {
    const payment = event?.payload?.payment?.entity;

    if (payment?.order_id) {
      try {
        const failedOrder = await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id, status: "pending" },
          { paymentStatus: "failed", status: "cancelled" },
          { new: true },
        );

        if (failedOrder) {
          for (const item of failedOrder.items) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });
          }
          Logger.info(
            "Webhook: payment.failed — order cancelled and stock restored",
            {
              orderId: failedOrder._id,
              paymentId: payment?.id,
              razorpayOrderId: payment.order_id,
            },
          );
        } else {
          Logger.warn(
            "Webhook: payment.failed — no pending order found to cancel (may already be cancelled)",
            { razorpayOrderId: payment.order_id },
          );
        }
      } catch (err) {
        Logger.error("Webhook: error handling payment.failed", {
          razorpayOrderId: payment.order_id,
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    Logger.info("Webhook: payment failed", {
      paymentId: payment?.id,
      orderId: payment?.order_id,
      reason: payment?.error_description,
    });
    res.status(200).json({ received: true });
    return;
  }

  Logger.info(`Webhook: unhandled event type "${eventType}" — acknowledged`);
  res.status(200).json({ received: true });
};
