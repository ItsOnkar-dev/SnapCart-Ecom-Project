import { Router } from "express";
import {
  addToWishlist,
  emailWishlist,
  getSharedWishlist,
  getWishlist,
  moveWishlistToCart,
  removeFromWishlist,
  toggleWishlistShare,
} from "../controllers/wishlist.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { csrfProtection } from "../middleware/csrf.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  addToWishlistSchema,
  emailWishlistSchema,
  toggleWishlistShareSchema,
} from "../validators/wishlist.validator";

const router = Router();

// Public routes - get shared wishlist
router.get("/share/:shareId", getSharedWishlist);

// Authenticated routes
router.use(verifyToken);

router.get("/", getWishlist);
router.post(
  "/add",
  validate(addToWishlistSchema),
  csrfProtection,
  addToWishlist,
);
router.delete(
  "/remove/:productId",
  csrfProtection,
  removeFromWishlist,
);
router.post("/move-to-cart", moveWishlistToCart);
router.patch(
  "/share",
  validate(toggleWishlistShareSchema),
  toggleWishlistShare,
);
router.post("/email", validate(emailWishlistSchema), emailWishlist);

export default router;
