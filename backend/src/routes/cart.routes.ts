import { Router } from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../controllers/cart.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { csrfProtection } from "../middleware/csrf.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.validator";

const router = Router();

// All cart routes require login — cart is personal
router.use(verifyToken);

router.post("/add", validate(addToCartSchema), addToCart);
router.get("/", getCart);
router.patch(
  "/:productId",
  validate(updateCartItemSchema),
  updateCartItem,
);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

export default router;
