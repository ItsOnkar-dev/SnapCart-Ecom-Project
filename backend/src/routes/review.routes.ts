import { Router } from "express";
import {
  createReview,
  deleteReview,
  getProductReviews,
} from "../controllers/review.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createReviewSchema } from "../validators/review.validator";

const router = Router();

// Public — anyone can read reviews
router.get("/:productId", getProductReviews);

// Must be logged in to write or delete
router.post(
  "/:productId",
  verifyToken,
  validate(createReviewSchema),
  createReview,
);
router.delete("/:id", verifyToken, deleteReview);

export default router;
