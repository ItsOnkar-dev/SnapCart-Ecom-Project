import { Router } from "express";
import {
  getMyOrders,
  getOrderById,
  placeOrder,
  updateOrderStatus,
} from "../controllers/order.controller";
import {
  requireRole,
  requireVerifiedEmail,
  verifyToken,
} from "../middleware/auth.middleware";
import { csrfProtection } from "../middleware/csrf.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  placeOrderSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator";

const router = Router();

// POST /api/orders — DIRECT order placement (NO payment gateway involved).
//
// Historically customers hit this endpoint after filling their shipping
// address. Once Razorpay was introduced, all real checkouts flow through
// /api/payments/create-order → /api/payments/verify instead, which is the
// only path that actually collects money.
//
// Leaving this route open would let any authenticated + email-verified user
// create fulfilled orders and drain stock WITHOUT PAYING. It's now locked to
// admins for manual/COD entries.
router.post(
  "/",
  verifyToken,
  requireRole("admin"),
  requireVerifiedEmail,
  csrfProtection,
  validate(placeOrderSchema),
  placeOrder,
);
router.get("/", verifyToken, getMyOrders);
router.get("/:id", verifyToken, getOrderById);

// Admin/seller route — update order status
router.patch(
  "/:id/status",
  verifyToken,
  requireRole("admin", "seller"),
  csrfProtection,
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
