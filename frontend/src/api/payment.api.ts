// src/api/payment.api.ts
import { api } from "@/lib/axios";
import type { ShippingAddress } from "@/types/order.types";

// Step 1 — tell backend to create a Razorpay order
export const createRazorpayOrderApi = (
  shippingAddress: ShippingAddress,
  couponCode?: string,
) => api.post("/payments/create-order", { shippingAddress, couponCode });

// Step 2 — send payment proof to backend for verification
export const verifyPaymentApi = (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => api.post("/payments/verify", data);
