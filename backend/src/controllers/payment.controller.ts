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

// Razorpay instance — created once, reused across requests
const razorpay = new Razorpay({
  key_id: env.razorpay.keyId!,
  key_secret: env.razorpay.keySecret!,
});

async function confirmPaidOrder(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  userId?: string,
): Promise<{ _id: unknown; couponCode?: string | null; user: unknown }> {
  // Idempotency guard
  const existingByPaymentId = await Order.findOne({ razorpayPaymentId });
  if (existingByPaymentId) {
    // If a userId was provided (from /verify), enforce ownership
    if (userId && existingByPaymentId.user.toString() !== userId) {
      throw new ApiError(403, "This payment does not belong to your account");
    }
    Logger.info("[PAYMENT] Order already confirmed — idempotent return", {
      razorpayPaymentId,
      orderId: existingByPaymentId._id,
    });
    return existingByPaymentId;
  }

  // Atomic transition: pending → confirmed
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
    // Another path (verify or webhook) already confirmed it. Look up the already-confirmed order so we can return a useful object.
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

    // Genuine missing order — this is a retryable failure for the webhook.
    // For /verify it means the order wasn't found for this user+razorpayOrderId.
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

  // Coupon usage increment (only on actual transition)
  if (order.couponCode) {
    await incrementCouponUsage(order.couponCode);
  }

  // Clear the cart
  await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });

  Logger.info("[PAYMENT] Order confirmed successfully", {
    orderId: order._id,
    razorpayPaymentId,
    userId: order.user,
  });

  return order;
}

// POST /api/payments/create-order

// Stock is reserved here (atomically decremented), NOT in /verify.
// If Razorpay order creation or DB save fails, already-reserved items are restored before throwing.
// This means: /verify never needs to touch stock, /webhook never needs to touch stock, and payment.failed must restore stock (see handleWebhook)

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

    // Fetch cart with populated product details
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    // Calculate total server-side — NEVER trust the amount from frontend
    const SHIPPING_THRESHOLD = 500;
    const SHIPPING_COST = 49;

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product as unknown as IProduct;

      // Validate stock before accepting payment
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

      // Build order items while we're already looping
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

    // Razorpay amounts are in the smallest currency unit (INR: paise)
    const amountInPaise = Math.round(total * 100);

    // Reserve stock before opening the Razorpay popup
    // Atomically decrement each item with a stock guard so two users racing for the last unit cannot both proceed to payment.
    // If any item fails (out of stock at this moment), already-reserved items are rolled back and a 400 is thrown — the user sees "only N units left" before the popup even opens.
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
        // This item is now out of stock — restore all previously reserved items
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

    // Create Razorpay order — this is NOT our DB order, just a payment intent.
    // If this fails, restore reserved stock and abort.
    // The Razorpay SDK types mark orders.create as returning void in some versions; we cast to the known shape we need.
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
      // Restore stock before propagating the error
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

    // Save a pending Order to DB immediately.
    // If the user pays but closes the tab before /verify completes, the webhook can find this order by razorpayOrderId and confirm it — because the shippingAddress is already saved here.
    // Stock is already reserved above — /verify and /webhook must NOT decrement again.
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
      // DB save failed — restore stock so items don't stay locked
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
        orderId: razorpayOrderId, // "order_xxxxxxxxxxxx" — goes to frontend
        amount: razorpayAmount, // in paise — Razorpay popup uses this
        currency: razorpayCurrency,
        keyId: env.razorpay.keyId, // frontend needs this to init Razorpay
        subtotal,
        shipping,
        total,
      }),
    );
  },
);

// POST /api/payments/verify
// Step 2 of payment flow — called after user completes payment in popup.
// Stock was already reserved in create-order; this endpoint only confirms the order and clears the cart via confirmPaidOrder.
export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(400, "Payment verification information is incomplete");
    }

    // Signature verification
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", env.razorpay.keySecret!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError(400, "Payment verification failed. Please try again.");
    }

    // Confirm the pending order (shared helper)
    // Handles idempotency, ownership check, coupon increment, cart clear.
    // Does NOT touch stock (already reserved in create-order).
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
// Called directly by Razorpay — NOT by your frontend.
// This is the safety net for when the user pays but closes the tab before /verify is called.
// Razorpay retries this endpoint until it gets a 200.
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

  // Verify webhook signature
  // Razorpay signs the raw body with your webhook secret using SHA256. We recompute it and compare — if mismatch, reject immediately.
  // req.body here is the raw Buffer because of the rawBodyParser in app.ts.
  const razorpaySignature = req.headers["x-razorpay-signature"] as string;

  if (!razorpaySignature) {
    Logger.error("Webhook received without signature header");
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.body) // req.body is raw Buffer here — NOT parsed JSON
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    Logger.error("Webhook signature mismatch — possible spoofed request");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  // Parse the raw body now that signature is verified
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

  // Handle payment.captured
  if (eventType === "payment.captured") {
    const payment = event?.payload?.payment?.entity;

    if (!payment) {
      Logger.error("Webhook payment.captured missing payload");
      res.status(200).json({ received: true }); // Still 200 — malformed payload is terminal
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
      // confirmPaidOrder handles idempotency check internally.
      // No userId passed — webhook has no user session.
      // Stock was already reserved in create-order; confirmPaidOrder only
      // confirms the order and clears the cart.
      await confirmPaidOrder(razorpayOrderId, razorpayPaymentId);

      res.status(200).json({ received: true });
    } catch (err) {
      const isApiError = err instanceof ApiError;
      // 404 from confirmPaidOrder means the pending order genuinely doesn't
      // exist — don't retry forever, but log it prominently.
      if (isApiError && err.statusCode === 404) {
        Logger.error(
          "Webhook: pending order not found — possibly orphaned Razorpay order",
          {
            razorpayOrderId,
            razorpayPaymentId,
            error: err.message,
          },
        );
        // Return 200 so Razorpay stops retrying an order we have no record of
        res.status(200).json({ received: true });
        return;
      }

      // Any other error (DB timeout, connection issue, etc.) → 500
      // Razorpay will retry with exponential backoff
      Logger.error("Webhook: transient error processing payment.captured", {
        razorpayPaymentId,
        razorpayOrderId,
        error: err instanceof Error ? err.message : err,
      });
      res.status(500).json({ error: "Transient error — please retry" });
    }

    return;
  }

  // Handle payment.failed
  if (eventType === "payment.failed") {
    const payment = event?.payload?.payment?.entity;

    if (payment?.order_id) {
      try {
        // Mark the pending order as failed so it doesn't sit as "pending" forever
        const failedOrder = await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id, status: "pending" },
          { paymentStatus: "failed", status: "cancelled" },
          { new: true },
        );

        // Restore the stock that was reserved in create-order
        // Now that payment has definitively failed, return the items to inventory
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

  // Acknowledge all other events
  // Razorpay sends many event types. Always respond 200 for unhandled ones so Razorpay doesn't keep retrying.
  Logger.info(`Webhook: unhandled event type "${eventType}" — acknowledged`);
  res.status(200).json({ received: true });
};
