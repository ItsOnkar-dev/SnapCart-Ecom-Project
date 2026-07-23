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

const router = Router();

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

// Refresh runs on every tab focus / token expiry; needs its own generous limiter
// so a user with multiple tabs isn't forced to re-login every 10 minutes.
const refreshLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many token refresh attempts, please try again later",
  },
});

router.get("/csrf-token", (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  const isProduction = process.env.NODE_ENV === "production";
  res
    .cookie("csrfToken", token, {  // non-httpOnly cookie (JS reads via document.cookie)
      httpOnly: false,  // JS must be able to read it
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    })
    .status(200)
    .json(new ApiResponse(200, "CSRF token generated"));
});

router.post("/register", validate(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", passwordResetLimiter, resendVerification);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", csrfProtection, refreshLimiter, refreshAccessToken);
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
