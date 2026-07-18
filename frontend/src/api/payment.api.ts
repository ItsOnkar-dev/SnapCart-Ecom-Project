// src/api/payment.api.ts
import { api } from "@/lib/axios";
import type { ShippingAddress } from "@/types/order.types";

// Step 1 — tell backend to create a Razorpay order
export const createRazorpayOrderApi = () => api.post("/payments/create-order");

// Step 2 — send payment proof to backend for verification
export const verifyPaymentApi = (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  shippingAddress: ShippingAddress;
  subtotal: number; 
  shipping: number; 
  total: number; 
}) => api.post("/payments/verify", data);
