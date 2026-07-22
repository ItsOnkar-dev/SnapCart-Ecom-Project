import { Router } from "express";
import {
  getAdminDashboardMetrics,
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
// GET /api/admin/dashboard
// Protect with token AND strict admin role check
router.get(
  "/dashboard",
  verifyToken,
  requireRole("admin"),
  getAdminDashboardMetrics,
);

export default router;
