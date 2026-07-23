import crypto from "crypto";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Logger } from "../utils/logger";

// ── Razorpay instance — created once, reused across requests ─────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-order
//
// Step 1 of payment flow.
// Called when user clicks "Proceed to Checkout" after filling address.
// ─────────────────────────────────────────────────────────────────────────────
export const createRazorpayOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

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
      const product = item.product as any;

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
    const total = subtotal + shipping;

    // Razorpay amounts are in the smallest currency unit (INR: paise)
    const amountInPaise = Math.round(total * 100);

    // Create Razorpay order — this is NOT our DB order, just a payment intent
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: userId.toString(),
      },
    });
    // save a pending Order to DB immediately
    // If the user pays but closes the tab before /verify completes,
    // the webhook can find this order by razorpayOrderId and confirm it —
    // because the shippingAddress is already saved here.
    await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal,
      shipping,
      totalPrice: total,
      paymentMethod: "razorpay",
      paymentStatus: "pending", // ← will be updated to "paid" by /verify or webhook
      status: "pending", // ← will be updated to "confirmed" by /verify or webhook
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(200).json(
      new ApiResponse(200, "Razorpay order created", {
        orderId: razorpayOrder.id, // "order_xxxxxxxxxxxx" — goes to frontend
        amount: razorpayOrder.amount, // in paise — Razorpay popup uses this
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this to init Razorpay
        subtotal,
        shipping,
        total,
      }),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/verify
//
// Step 2 of payment flow — called after user completes payment in popup.
// ─────────────────────────────────────────────────────────────────────────────
export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    await new Promise((resolve) => setTimeout(resolve, 10000));

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(400, "Missing payment verification fields");
    }

    // ── Signature verification ─────────────────────────────────────────────
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError(
        400,
        "Payment verification failed. Invalid signature.",
      );
    }

    // ── Idempotency guard ──────────────────────────────────────────────────
    // Prevents double-creating orders if the client retries /verify with the
    // same (already-valid) razorpay payment id.
    const existing = await Order.findOne({ razorpayPaymentId });
    if (existing) {
      if (existing.user.toString() !== req.user!._id.toString()) {
        throw new ApiError(403, "This payment does not belong to your account");
      }
      res.status(200).json(
        new ApiResponse(200, "Payment already verified", {
          orderId: existing._id,
          razorpayPaymentId,
        }),
      );
      return;
    }

    // ── Find the pending order saved in create-order step ─────────────────
    const order = await Order.findOneAndUpdate(
      {
        razorpayOrderId,
        user: req.user!._id,
        status: "pending", // safety: only update if still pending
        paymentStatus: "pending",
      },
      {
        paymentStatus: "paid",
        status: "confirmed",
        razorpayPaymentId, // attach payment ID now that we have it
      },
      { new: true },
    );

    if (!order) {
      // Pending order not found — log for investigation
      Logger.error("[PAYMENT/VERIFY] Pending order not found", {
        razorpayOrderId,
        userId: req.user!._id.toString(),
      });
      throw new ApiError(404, "Order not found. Please contact support.");
    }

    // ── Clear the cart now that order is confirmed ─────────────────────────
    await Cart.findOneAndUpdate(
      { user: req.user!._id },
      { $set: { items: [] } },
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
//
// Called directly by Razorpay — NOT by your frontend.
// This is the safety net for when the user pays but closes the tab before /verify is called.
// Razorpay retries this endpoint until it gets a 200.
//
// CRITICAL differences from /verify:
//  1. No verifyToken — Razorpay has no user session cookie
//  2. No CSRF — Razorpay is a server-to-server call
//  3. Raw body required — signature is computed on the raw request body,
//     NOT the parsed JSON. That's why app.ts registers a raw body parser
//     ONLY for this route BEFORE express.json() runs globally.
//  4. Must respond 200 quickly — Razorpay retries if it doesn't get 200
//     within a few seconds. Do heavy work asynchronously if needed.

export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

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
  let event: any;
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
      res.status(200).json({ received: true }); // Still 200 — don't make Razorpay retry
      return;
    }

    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;

    try {
      // Idempotency check — if /verify already ran, order already exists
      const existingOrder = await Order.findOne({ razorpayPaymentId });
      if (existingOrder) {
        Logger.info("Webhook: order already exists, skipping", {
          razorpayPaymentId,
          orderId: existingOrder._id,
        });
        res.status(200).json({ received: true });
        return;
      }

      // ── NEW: find the pending order and confirm it ──────────────────────
      // This works because create-order already saved the order with
      // shippingAddress + razorpayOrderId. No manual reconciliation needed.
      const order = await Order.findOneAndUpdate(
        {
          razorpayOrderId,
          status: "pending",
          paymentStatus: "pending",
        },
        {
          paymentStatus: "paid",
          status: "confirmed",
          razorpayPaymentId,
        },
        { new: true },
      );

      if (!order) {
        Logger.error("Webhook: pending order not found for razorpayOrderId", {
          razorpayOrderId,
          razorpayPaymentId,
        });
        res.status(200).json({ received: true });
        return;
      }

      // Clear the cart — user's tab is closed so we can't do this client-side
      await Cart.findOneAndUpdate(
        { user: order.user },
        { $set: { items: [] } },
      );

      Logger.info("Webhook: order confirmed successfully", {
        orderId: order._id,
        razorpayPaymentId,
        userId: order.user,
      });

      res.status(200).json({ received: true });
    } catch (err) {
      Logger.error("Webhook: error processing payment.captured", {
        razorpayPaymentId,
        error: err instanceof Error ? err.message : err,
      });
      // Still 200 — prevent Razorpay from retrying indefinitely
      res.status(200).json({ received: true });
    }

    return;
  }

  // Handle payment.failed
  if (eventType === "payment.failed") {
    const payment = event?.payload?.payment?.entity;

    // Mark the pending order as failed so it doesn't sit as "pending" forever
    if (payment?.order_id) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id, status: "pending" },
        { paymentStatus: "failed", status: "cancelled" },
      ).catch((err) =>
        Logger.error("Webhook: failed to mark order as cancelled", { err }),
      );
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
