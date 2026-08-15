import { Router } from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../controllers/cart.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.validator";

const router = Router();

// All cart routes require login — cart is personal
router.use(verifyToken);

router.post(
  "/add",
  requireRole("customer", "seller"),
  validate(addToCartSchema),
  addToCart,
);
router.get("/", getCart);
router.patch(
  "/:productId",
  requireRole("customer", "seller"),
  validate(updateCartItemSchema),
  updateCartItem,
);
router.delete("/:productId", requireRole("customer", "seller"), removeFromCart);
router.delete("/", requireRole("customer", "seller"), clearCart);

export default router;
