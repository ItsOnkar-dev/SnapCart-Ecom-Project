import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/product.controller";
import { getRecommendations } from "../controllers/recommendation.controller";
import {
  optionalVerifyToken,
  requireRole,
  requireVerifiedEmail,
  verifyToken,
} from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator";

const router = Router();

// Public routes — no login needed
router.get("/", getAllProducts);
router.get("/recommendations", optionalVerifyToken, getRecommendations);
router.get("/:id", getProductById);

// Seller only — must be logged in + must be a seller
// upload.single("image") runs before controller — file is in req.file.buffer by the time controller runs
router.post(
  "/",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  upload.single("image"),
  validate(createProductSchema),
  createProduct,
);
router.patch(
  "/:id",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  upload.single("image"),
  validate(updateProductSchema),
  updateProduct,
);
router.delete(
  "/:id",
  verifyToken,
  requireVerifiedEmail,
  requireRole("seller"),
  deleteProduct,
);

export default router;
