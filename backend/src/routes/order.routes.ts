import { Router } from "express";
import {
  cancelOrder,
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

router.post(
  "/",
  verifyToken,
  requireRole("seller", "customer"),
  requireVerifiedEmail,
  validate(placeOrderSchema),
  placeOrder,
);
router.get("/", verifyToken, getMyOrders);
router.get("/:id", verifyToken, getOrderById);

// PATCH /api/orders/:id/cancel — customer-initiated cancellation (before shipped)
router.patch(
  "/:id/cancel",
  verifyToken,
  requireRole("customer", "seller"),
  cancelOrder,
);

// Admin/seller route — update order status
router.patch(
  "/:id/status",
  verifyToken,
  requireRole("admin", "seller"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
