import { Router } from "express";

const router = Router();

import {
  createCoupon,
  deleteCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
} from "../controllers/coupon.admin.controller";
import { applyCoupon } from "../controllers/coupon.controller";
import { verifyToken, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCouponSchema } from "../validators/coupon.validator";

// Public — apply coupon at checkout
router.post("/apply", verifyToken, applyCoupon);

// Admin routes
router.get("/", verifyToken, requireRole("admin"), getAllCoupons);
router.get("/:id", verifyToken, requireRole("admin"), getCouponById);
router.post("/", verifyToken, requireRole("admin"), validate(createCouponSchema), createCoupon);
router.patch("/:id", verifyToken, requireRole("admin"), updateCoupon);
router.delete("/:id", verifyToken, requireRole("admin"), deleteCoupon);

export default router;
