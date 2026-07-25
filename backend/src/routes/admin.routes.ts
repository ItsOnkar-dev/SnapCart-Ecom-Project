import { Router } from "express";
import {
  getAdminDashboardMetrics,
  getAllOrders,
  getAllProductsCount,
  getAnalytics,
  getPendingSellers,
  updateSellerStatus,
} from "../controllers/admin.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateSellerStatusSchema } from "../validators/admin.validator";

const router = Router();

// All admin routes — must be logged in + must be admin
router.get("/analytics", verifyToken, requireRole("admin"), getAnalytics);
router.get("/sellers", verifyToken, requireRole("admin"), getPendingSellers);
router.patch(
  "/sellers/:id",
  verifyToken,
  requireRole("admin"),
  validate(updateSellerStatusSchema),
  updateSellerStatus,
);
router.get(
  "/dashboard",
  verifyToken,
  requireRole("admin"),
  getAdminDashboardMetrics,
);
router.get(
  "/orders",
  verifyToken,
  requireRole("admin"),
  getAllOrders,
);
router.get(
  "/products/count",
  verifyToken,
  requireRole("admin"),
  getAllProductsCount,
);

export default router;
