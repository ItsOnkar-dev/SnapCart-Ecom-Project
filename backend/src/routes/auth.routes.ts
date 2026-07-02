import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller";
import {
  googleAuth,
  googleCallback,
} from "../controllers/googleAuth.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

// dedicated limiter for forgot-password — tighter than authLimiter
// 5 attempts per 10 min is enough for any legit user; beyond that it's abuse
const passwordResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password reset attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post("/register", validate(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshAccessToken);
router.get("/me", verifyToken, getCurrentUser);
router.post("/logout", verifyToken, logout);
router.patch(
  "/change-password",
  verifyToken,
  validate(changePasswordSchema),
  changePassword,
);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
