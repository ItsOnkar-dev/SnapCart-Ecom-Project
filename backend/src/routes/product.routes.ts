import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/product.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";

const router = Router();

// Public routes — no login needed
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Seller only — must be logged in + must be a seller
// upload.single("image") runs before controller — file is in req.file.buffer by the time controller runs
router.post(
  "/",
  verifyToken,
  requireRole("seller"),
  upload.single("image"),
  createProduct,
);
router.patch(
  "/:id",
  verifyToken,
  requireRole("seller"),
  upload.single("image"),
  updateProduct,
);
router.delete("/:id", verifyToken, requireRole("seller"), deleteProduct);

export default router;
