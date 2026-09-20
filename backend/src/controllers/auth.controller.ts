import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/validateEnv";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { User } from "../models/user.model";
import { Wishlist } from "../models/wishlist.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { auditLog } from "../utils/auditLogger";
import { generateResetToken } from "../utils/generateResetToken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens";
import { hashToken } from "../utils/hashToken";
import { sendPasswordChangedEmail } from "../utils/sendPasswordChangedEmail";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "../utils/sendVerificationEmail";

const getVerificationLink = (rawToken: string) =>
  `${env.frontendUrl}/verify-email?token=${rawToken}`;

const getResetPasswordLink = (rawToken: string) =>
  `${env.frontendUrl}/reset-password?token=${rawToken}`;

const isDemoVerificationEnabled = () =>
  env.email.demoMode === "true" ||
  !env.email.resendApiKey ||
  !`SnapCart <${env.email.resendFrom}>`;

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({
    email: email.toLowerCase().trim(),
  });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { rawToken, hashedToken } = generateVerificationToken();

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
  });

  let demoVerificationUrl: string | undefined;
  try {
    if (isDemoVerificationEnabled()) {
      demoVerificationUrl = getVerificationLink(rawToken);
      console.info("Demo verification link:", demoVerificationUrl);
    } else {
      await sendVerificationEmail(user, rawToken);
    }
  } catch (err) {
    console.error("Failed to send verification email:", err);
    demoVerificationUrl = getVerificationLink(rawToken);
    console.info("Fallback demo verification link:", demoVerificationUrl);
  }

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    demoVerificationUrl,
  };

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        demoVerificationUrl
          ? "Account created. Email delivery is in demo mode, so use the verification link shown on screen."
          : "Account created. Please check your email to verify your account.",
        userResponse,
      ),
    );
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password +failedLoginAttempts +lockedUntil",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(
      423,
      `Account is temporarily locked. Please try again in ${mins} minute${mins > 1 ? "s" : ""}.`,
    );
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password!);

  if (!isPasswordCorrect) {
    user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      user.failedLoginAttempts = 0;
      await user.save({ validateBeforeSave: false });
    } else {
      await user.save({ validateBeforeSave: false });
    }
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const isProduction = env.nodeEnv === "production";

  const accessTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 15 * 60 * 1000,
  };

  const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  auditLog("auth.login", user._id.toString(), { email: user.email });

  res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(200, "Login successful", {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      }),
    );
});

// POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.jwt.refreshSecret as string) as {
        userId: string;
      };
    } catch {
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || !user.refreshToken || user.refreshToken !== hashToken(token)) {
      if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
      throw new ApiError(401, "Your session has expired. Please log in again.");
    }

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    auditLog("auth.refresh", user._id.toString(), { email: user.email });

    const isProduction = env.nodeEnv === "production";

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json(new ApiResponse(200, "Token refreshed successfully"));
  },
);

// GET /api/auth/me
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(200).json(
      new ApiResponse(200, "User fetched successfully", {
        _id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        avatar: req.user!.avatar,
        isEmailVerified: req.user!.isEmailVerified,
        createdAt: req.user!.createdAt,
      }),
    );
  },
);

// POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, {
    refreshToken: null,
  });

  auditLog("auth.logout", req.user?._id?.toString(), {
    email: req.user?.email,
  });

  const isProduction = env.nodeEnv === "production";

  res
    .status(200)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/api/auth",
    })
    .json(new ApiResponse(200, "Logged out successfully"));
});

// GET /api/auth/verify-email?token=abc123...
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Verification link is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationTokenExpiry");

  if (!user) {
    throw new ApiError(400, "Verification link is invalid or has expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  auditLog("auth.email_verify", user._id.toString(), { email: user.email });

  res.status(200).json(new ApiResponse(200, "Email verified successfully"));
});

// POST /api/auth/resend-verification
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "If an account exists, a verification email has been sent",
          ),
        );
      return;
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, "This email is already verified");
    }

    const { rawToken, hashedToken } = generateVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    let demoVerificationUrl: string | undefined;
    try {
      if (isDemoVerificationEnabled()) {
        demoVerificationUrl = getVerificationLink(rawToken);
        console.info("Demo verification link:", demoVerificationUrl);
      } else {
        await sendVerificationEmail(user, rawToken);
      }
    } catch (err) {
      console.error("Failed to resend verification email:", err);
      demoVerificationUrl = getVerificationLink(rawToken);
      console.info("Fallback demo verification link:", demoVerificationUrl);
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          demoVerificationUrl
            ? "Email delivery is in demo mode, so use the verification link shown on screen."
            : "If an account exists, a verification email has been sent",
          demoVerificationUrl ? { demoVerificationUrl } : null,
        ),
      );
  },
);

// PATCH /api/auth/change-password
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!._id).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (!user.password) {
      throw new ApiError(
        400,
        "Your account uses Google sign-in. Password change is not available.",
      );
    }
    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordCorrect) {
      throw new ApiError(401, "Current password is incorrect");
    }
    user.password = await bcrypt.hash(newPassword, 12);

    user.passwordChangedAt = new Date();
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    await sendPasswordChangedEmail(user);

    auditLog("auth.password_change", req.user?._id?.toString(), {
      email: user.email,
    });

    const isProduction = env.nodeEnv === "production";
    res
      .status(200)
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/api/auth",
      })
      .json(
        new ApiResponse(
          200,
          "Password changed successfully. Please log in again.",
          null,
        ),
      );
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "If that email exists, a reset link has been sent.",
            null,
          ),
        );
      return;
    }

    const { rawToken, hashedToken } = generateResetToken();

    user.passwordResetToken = hashedToken;
    user.passwordResetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    let demoResetUrl: string | undefined;
    try {
      if (isDemoVerificationEnabled()) {
        demoResetUrl = getResetPasswordLink(rawToken);
        console.info("Demo reset link:", demoResetUrl);
      } else {
        await sendPasswordResetEmail(user, rawToken);
      }
    } catch (err) {
      console.error("Failed to send reset email:", err);
      demoResetUrl = getResetPasswordLink(rawToken);
      console.info("Fallback demo reset link:", demoResetUrl);
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "If that email exists, a reset link has been sent.",
          demoResetUrl ? { demoResetUrl } : null,
        ),
      );
    return;
  },
);

// DELETE /api/auth/account
export const deleteAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

    await Promise.all([
      Cart.deleteMany({ user: userId }),
      Wishlist.deleteMany({ user: userId }),
      Order.updateMany({ user: userId }, { $set: { user: null } }),
    ]);

    await User.findByIdAndDelete(userId);

    const isProduction = env.nodeEnv === "production";
    res
      .status(200)
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/api/auth",
      })
      .json(new ApiResponse(200, "Account deleted successfully"));
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: new Date() }, // must still be within the 15-min window
    });

    if (!user) {
      throw new ApiError(
        400,
        "The password reset link is invalid or has expired.",
      );
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;

    user.refreshToken = undefined;

    await user.save({ validateBeforeSave: false });

    await sendPasswordChangedEmail(user);

    auditLog("auth.password_reset_completed", user._id.toString(), {
      email: user.email,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Password reset successful. Please log in again.",
          null,
        ),
      );
    return;
  },
);
