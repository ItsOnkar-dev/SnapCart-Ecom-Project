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

// Customer routes — must be logged in
router.post(
  "/",
  verifyToken,
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
  csrfProtection,
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
