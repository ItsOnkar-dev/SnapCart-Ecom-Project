import { Router } from "express";
import {
  adminDeleteProduct,
  getAdminDashboardMetrics,
  getAllOrders,
  getAllProducts,
  getAllProductsCount,
  getAnalytics,
  getPendingSellers,
  updateAdminProduct,
  updateSellerStatus,
} from "../controllers/admin.controller";
import { updateAdminProductStatus } from "../controllers/product.controller";
import {
  requirePermission,
  requireRole,
  verifyToken,
} from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";
import { validate } from "../middleware/validate.middleware";
import { updateSellerStatusSchema } from "../validators/admin.validator";

const router = Router();

// All admin routes — must be logged in + be admin or demo_admin
router.get(
  "/analytics",
  verifyToken,
  requireRole("admin", "demo_admin"),
  requirePermission("view_dashboard"),
  getAnalytics,
);
router.get(
  "/sellers",
  verifyToken,
  requireRole("admin", "demo_admin"),
  requirePermission("view_dashboard"),
  getPendingSellers,
);
router.patch(
  "/sellers/:id",
  verifyToken,
  requireRole("admin"),
  requirePermission("approve_sellers"),
  validate(updateSellerStatusSchema),
  updateSellerStatus,
);
router.get(
  "/dashboard",
  verifyToken,
  requireRole("admin", "demo_admin"),
  requirePermission("view_dashboard"),
  getAdminDashboardMetrics,
);
router.get(
  "/orders",
  verifyToken,
  requireRole("admin", "demo_admin"),
  requirePermission("view_orders"),
  getAllOrders,
);
router.get(
  "/products",
  verifyToken,
  requireRole("admin", "demo_admin"),
  requirePermission("view_dashboard"),
  getAllProducts,
);
router.get(
  "/products/count",
  verifyToken,
  requireRole("admin", "demo_admin"),
  requirePermission("view_dashboard"),
  getAllProductsCount,
);

router.patch(
  "/products/:id",
  verifyToken,
  requireRole("admin"),
  requirePermission("manage_products"),
  upload.single("image"),
  updateAdminProduct,
);

// Toggle product visibility — uses existing controller from product.controller.ts
router.patch(
  "/products/:id/status",
  verifyToken,
  requireRole("admin"),
  requirePermission("manage_products"),
  updateAdminProductStatus,
);

// Hard delete — permanent, only admin can do this
router.delete(
  "/products/:id",
  verifyToken,
  requireRole("admin"),
  requirePermission("manage_products"),
  adminDeleteProduct,
);

export default router;
