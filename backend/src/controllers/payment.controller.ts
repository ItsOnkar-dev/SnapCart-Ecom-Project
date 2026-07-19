import crypto from "crypto";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { placeOrderService } from "../services/order.service";
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

    // Fetch cart with populated product details
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    // Calculate total server-side — NEVER trust the amount from frontend
    const SHIPPING_THRESHOLD = 500;
    const SHIPPING_COST = 49;

    let subtotal = 0;
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
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddress,
      subtotal,
      shipping,
      total,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(400, "Missing payment verification fields");
    }

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

    // ── Payment is genuine — now create the actual DB order ───────────────
    try {
      const order = await placeOrderService(req.user!._id, shippingAddress, {
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        status: "confirmed",
        razorpayOrderId,
        razorpayPaymentId,
        subtotal,
        shipping,
        total,
      });

      res.status(201).json(
        new ApiResponse(201, "Payment verified and order placed successfully", {
          orderId: order._id,
          razorpayPaymentId,
        }),
      );
    } catch (err) {
      // Log for manual reconciliation if backend DB fails but user was charged
      Logger.error("[PAYMENT/ORPHAN] Paid but order creation failed", {
        userId: req.user!._id.toString(),
        razorpayOrderId,
        razorpayPaymentId,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  },
);

// POST /api/payments/webhook
//
// Called directly by Razorpay — NOT by your frontend.
// This is the safety net for when the user pays but closes the tab before
// /verify is called. Razorpay retries this endpoint until it gets a 200.
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

      // Fetch the Razorpay order to get the userId from notes
      // (we embedded it in createRazorpayOrder for exactly this purpose)
      const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
      const userId = (rzpOrder.notes as any)?.userId;

      if (!userId) {
        Logger.error("Webhook: no userId in Razorpay order notes", {
          razorpayOrderId,
        });
        res.status(200).json({ received: true });
        return;
      }

      Logger.error(
        "Webhook: payment captured but no shippingAddress available for fallback order creation. " +
          "Manual reconciliation required.",
        {
          razorpayPaymentId,
          razorpayOrderId,
          userId,
          amount: payment.amount / 100,
        },
      );

      // Respond 200 so Razorpay stops retrying — we've logged it
      res.status(200).json({ received: true });
    } catch (err) {
      Logger.error("Webhook: error processing payment.captured", {
        razorpayPaymentId,
        error: err instanceof Error ? err.message : err,
      });
      res.status(200).json({ received: true });
    }

    return;
  }

  // Handle payment.failed
  if (eventType === "payment.failed") {
    const payment = event?.payload?.payment?.entity;
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
