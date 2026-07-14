import crypto from "crypto";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { placeOrderService } from "../services/order.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

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
      });

      res.status(201).json(
        new ApiResponse(201, "Payment verified and order placed successfully", {
          orderId: order._id,
          razorpayPaymentId,
        }),
      );
    } catch (err) {
      // Log for manual reconciliation if backend DB fails but user was charged
      console.error("[PAYMENT/ORPHAN] Paid but order creation failed", {
        userId: req.user!._id.toString(),
        razorpayOrderId,
        razorpayPaymentId,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  },
);
