import { Router } from "express";
import {
    createReview,
    deleteReview,
    getProductReviews,
} from "../controllers/review.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Public — anyone can read reviews
router.get("/:productId", getProductReviews);

// Must be logged in to write or delete
router.post("/:productId", verifyToken, createReview);
router.delete("/:id", verifyToken, deleteReview);

export default router;
