import { Router } from "express";
import {
  createRazorpayOrder,
  handleWebhook,
  verifyPayment,
} from "../controllers/payment.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Both routes require login — you can't pay without being authenticated
router.post("/create-order", verifyToken, createRazorpayOrder);
router.post("/verify", verifyToken, verifyPayment);
// No verifyToken — Razorpay calls this directly from their servers
router.post("/webhook", handleWebhook);

export default router;
