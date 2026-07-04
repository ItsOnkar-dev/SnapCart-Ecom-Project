import crypto from "crypto";
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
import { csrfProtection } from "../middleware/csrf.middleware";
import { validate } from "../middleware/validate.middleware";
import { ApiResponse } from "../utils/ApiResponse";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

// dedicated limiter for forgot-password — tighter than authLimiter
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

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts, please try again later",
  },
});

router.get("/csrf-token", (req, res) => {
  // 1. Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const isProduction = process.env.NODE_ENV === "production";
  // 2. Set the token as an httpOnly cookie
  res
    .cookie("csrfToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    })
    .status(200)
    .json(new ApiResponse(200, "CSRF token generated", { csrfToken: token }));
});

router.post("/register", registerLimiter, validate(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", passwordResetLimiter, resendVerification);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", loginLimiter, refreshAccessToken);
router.get("/me", verifyToken, getCurrentUser);
router.post("/logout", verifyToken, csrfProtection, logout);
router.patch(
  "/change-password",
  verifyToken,
  csrfProtection,
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
