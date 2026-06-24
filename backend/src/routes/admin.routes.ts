import { Router } from "express";
import {
    getPendingSellers,
    updateSellerStatus,
} from "../controllers/admin.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All admin routes — must be logged in + must be admin
router.get("/sellers", verifyToken, requireRole("admin"), getPendingSellers);
router.patch(
  "/sellers/:id",
  verifyToken,
  requireRole("admin"),
  updateSellerStatus,
);

export default router;
