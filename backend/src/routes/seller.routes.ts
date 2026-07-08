import { Router } from "express";
import {
  applyForSeller,
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
// Protect with token, email verification, and strict seller role check
router.get(
  "/products",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  getSellerProducts,
);

export default router;
