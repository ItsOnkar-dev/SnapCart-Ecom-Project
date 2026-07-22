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
import { validate } from "../middleware/validate.middleware";
import {
  placeOrderSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator";

const router = Router();

// POST /api/orders — DIRECT order placement (NO payment gateway involved).
// All real checkouts flow through /api/payments/create-order → /api/payments/verify instead, which is the
// only path that actually collects money.

router.post(
  "/",
  verifyToken,
  requireRole("admin"),
  requireVerifiedEmail,
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
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
