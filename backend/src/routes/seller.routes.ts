import { Router } from "express";
import { applyForSeller } from "../controllers/seller.controller";
import { requireRole, verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Must be logged in + must be a customer to apply
router.post("/apply", verifyToken, requireRole("customer"), applyForSeller);

export default router;
