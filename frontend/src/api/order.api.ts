// WHY THIS FILE EXISTS:
// Orders are the most critical part of the app — money is involved.
// Backend uses MongoDB transactions for order creation (stock deducted + order created atomically).
// Frontend just sends the request and trusts the backend's transaction.

import { api } from "@/lib/axios";
import type { ShippingAddress } from "@/types/order.types";

// POST /api/orders — requires verified email
// backend: validates cart, deducts stock, creates order, clears cart in one transaction
export const placeOrderApi = (shippingAddress: ShippingAddress) =>
  api.post("/orders", { shippingAddress });

// GET /api/orders — buyer sees their own orders only
export const getOrdersApi = () => api.get("/orders");

// GET /api/orders/:id
export const getOrderByIdApi = (id: string) => api.get(`/orders/${id}`);

// PATCH /api/orders/:id/status — seller or admin only
// statuses: pending → confirmed → shipped → delivered | cancelled
export const updateOrderStatusApi = (id: string, status: string) =>
  api.patch(`/orders/${id}/status`, { status });
