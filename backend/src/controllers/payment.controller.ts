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
//
// What it does:
//  1. Calculates order total from user's cart (never trust frontend total)
//  2. Creates a Razorpay order (just a payment request — nothing in our DB yet)
//  3. Returns the Razorpay order ID + amount to frontend
//  4. Frontend uses this to open the Razorpay payment popup
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

    // Razorpay amounts are in the smallest currency unit
    // For INR: paise (1 INR = 100 paise), for INR: cents
    // Since your store uses INR, multiply by 100
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
//
// What it does:
//  1. INRives razorpayOrderId + razorpayPaymentId + razorpaySignature from frontend
//  2. Verifies the signature using HMAC-SHA256
//     (this proves the payment came from Razorpay, not a fake request)
//  3. If valid → creates the actual DB order via placeOrderService
//  4. Saves Razorpay IDs on the order for reference
//  5. Returns the created order to frontend
//
// Why signature verification matters:
//  Without this, anyone could send a fake "payment success" request to your
//  backend and get an order created without actually paying.
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
    // Razorpay signs payments using: HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId)
    // using your KEY_SECRET as the HMAC key.
    // We recompute it and compare — if they match, the payment is genuine.
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      // Signature mismatch — this is either a bug or someone trying to fake a payment
      throw new ApiError(
        400,
        "Payment verification failed. Invalid signature.",
      );
    }

    // ── Payment is genuine — now create the actual DB order ───────────────
    // placeOrderService handles: creating order, deducting stock, clearing cart
    const order = await placeOrderService(req.user!._id, shippingAddress);

    // Save Razorpay IDs on the order for reference + admin tracking
    await Order.findByIdAndUpdate(
      order._id,
      {
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: "paid",
        status: "confirmed",
      },
      { returnDocument: "after" },
    );

    res.status(201).json(
      new ApiResponse(201, "Payment verified and order placed successfully", {
        orderId: order._id,
        razorpayPaymentId,
      }),
    );
  },
);
