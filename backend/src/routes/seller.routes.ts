import { Router } from "express";
import {
  generateListing,
  getSellerDrafts,
} from "../controllers/listingAssistant.controller";
import {
  applyForSeller,
  getSellerOrders,
  getSellerProducts,
  getSellerProfile,
  updateSellerProfile,
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

// GET /api/seller/profile
router.get(
  "/profile",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  getSellerProfile,
);

// PATCH /api/seller/profile
router.patch(
  "/profile",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  updateSellerProfile,
);

// GET /api/seller/listing-assistant/drafts
router.get(
  "/listing-assistant/drafts",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  getSellerDrafts,
);

// POST /api/seller/listing-assistant/generate
router.post(
  "/listing-assistant/generate",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  generateListing,
);

export default router;
