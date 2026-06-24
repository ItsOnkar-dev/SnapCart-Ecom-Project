import { Router } from "express";
import {
    addToCart,
    clearCart,
    getCart,
    removeFromCart,
    updateCartItem,
} from "../controllers/cart.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// All cart routes require login — cart is personal
router.use(verifyToken);

router.post("/add", addToCart);
router.get("/", getCart);
router.patch("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

export default router;
