import { Router } from "express";
import {
    getCurrentUser,
    login,
    logout,
    refreshAccessToken,
    register,
    resendVerification,
    verifyEmail,
} from "../controllers/auth.controller";
import {
    googleAuth,
    googleCallback,
} from "../controllers/googleAuth.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.get("/verify-email", verifyEmail); // public — no verifyToken needed
router.post("/resend-verification", resendVerification); // public — user isn't logged in yet
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshAccessToken);
router.get("/me", verifyToken, getCurrentUser);
router.post("/logout", verifyToken, logout);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
