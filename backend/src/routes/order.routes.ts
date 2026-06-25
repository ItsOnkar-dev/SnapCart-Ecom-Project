import { Router } from "express";
import {
    getMyOrders,
    getOrderById,
    placeOrder,
    updateOrderStatus,
} from "../controllers/order.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Customer routes — must be logged in
router.post("/", verifyToken, placeOrder);
router.get("/", verifyToken, getMyOrders);
router.get("/:id", verifyToken, getOrderById);

// Admin/seller route — update order status
router.patch(
  "/:id/status",
  verifyToken,
  requireRole("admin", "seller"),
  updateOrderStatus,
);

export default router;
