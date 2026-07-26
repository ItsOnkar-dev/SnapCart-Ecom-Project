import { Router } from "express";
import {
  applyForSeller,
  getSellerOrders,
  getSellerProducts,
} from "../controllers/seller.controller";
import {
  requireRole,
  requireVerifiedEmail,
  verifyToken,
} from "../middleware/auth.middleware";

const router = Router();

// Must be logged in + must be a customer to apply
router.post(
  "/apply",
  verifyToken,
  requireVerifiedEmail,
  requireRole("customer"),
  applyForSeller,
);
// GET /api/seller/products
router.get(
  "/products",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  getSellerProducts,
);
// GET /api/seller/orders
router.get(
  "/orders",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  getSellerOrders,
);

export default router;
