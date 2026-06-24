import { Router } from "express";
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    updateProduct,
} from "../controllers/product.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Public routes — no login needed
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Seller only routes — must be logged in + must be a seller
router.post("/", verifyToken, requireRole("seller"), createProduct);
router.patch("/:id", verifyToken, requireRole("seller"), updateProduct);
router.delete("/:id", verifyToken, requireRole("seller"), deleteProduct);

export default router;
