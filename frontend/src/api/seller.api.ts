// Seller flow has three actors — the customer applying, the admin approving,
// and the seller operating after approval.
// These functions cover all three sides cleanly.

import { api } from "../lib/axios";

// POST /api/seller/apply — customer applies to become a seller
// requires: logged in + verified email + role is "customer"
// backend reads user from cookie (req.user), sets sellerStatus: "pending"
// confirmed: controller takes nothing from req.body
export const applyAsSellerApi = () => api.post("/seller/apply");

// GET /api/admin/sellers — admin sees all pending seller applications
export const getPendingSellersApi = () => api.get("/admin/sellers");

// PATCH /api/admin/sellers/:id — admin approves or rejects
// paste your updateSellerStatus controller to confirm body shape
export const updateSellerStatusApi = (
  id: string,
  status: "approved" | "rejected",
) => api.patch(`/admin/sellers/${id}`, { status });
