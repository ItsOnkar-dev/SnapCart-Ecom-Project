import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateResetToken } from "../utils/generateResetToken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail";
import {
  generateVerificationToken,
  sendVerificationEmail,
} from "../utils/sendVerificationEmail";

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Step 1 — Pull data from request body
  const { name, email, password } = req.body;

  // Step 2 — Validate: make sure all fields are present
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  // Step 3 — Validate password length (model checks this too, but better to catch early)
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  // Step 4 — Check if this email is already registered
  const existingUser = await User.findOne({
    email: email.toLowerCase().trim(),
  });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Step 5 — Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 12);

  // NEW — generate the token pair BEFORE creating the user
  const { rawToken, hashedToken } = generateVerificationToken();

  // Step 6 — Create the user in DB
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    // save the hashed token + expiry directly on creation
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: new Date(Date.now() + 10 * 60 * 1000), //10 minutes from right now
  });

  // NEW — fire the email AFTER the user is saved
  try {
    await sendVerificationEmail(user, rawToken);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  // Step 7 — Send back user data (never send password — even hashed)
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Account created. Please check your email to verify your account.",
        userResponse,
      ),
    );
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Step 1 — Pull credentials from body
  const { email, password } = req.body;

  // Step 2 — Validate fields exist
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Step 3 — Find user by email
  // .select("+password") because password has select:false in schema — mongoose hides it by default
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
    // deliberately vague — don't tell attackers which emails exist in your DB
  }

  // Step 4 — Check account is active
  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Step 5 — Compare password they sent vs hashed one stored in DB
  const isPasswordCorrect = await bcrypt.compare(password, user.password!);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Step 6 — Generate both tokens using your existing generateTokens.ts
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  // Step 7 — Save refresh token in DB so we can invalidate it on logout
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  // validateBeforeSave:false — only refreshToken changed, no need to re-run all validators

  const isProduction = process.env.NODE_ENV === "production";

  // Step 8 — Cookie config
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

  // Step 9 — Attach cookies to response and send user data
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
        isEmailVerified: user.isEmailVerified,
      }),
    );
});

// POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Step 1 — Read refresh token from cookie
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(401, "No refresh token");
    }

    // Step 2 — Verify it
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET as string,
      ) as { userId: string };
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Step 3 — Find user and check stored refresh token matches
    const user = await User.findById(decoded.userId).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      // Token reuse detected — someone is using an old refresh token
      // This means the token may have been stolen — wipe all tokens
      if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
      throw new ApiError(
        401,
        "Refresh token reuse detected. Please login again.",
      );
    }

    // Step 4 — Issue new tokens (rotation)
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Step 5 — Save new refresh token, invalidate old one
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";

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
// verifyToken middleware runs before this — so req.user is already attached
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    // req.user is already the full user object from DB, attached by verifyToken
    // No need to query DB again
    res.status(200).json(
      new ApiResponse(200, "User fetched successfully", {
        _id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        isEmailVerified: req.user!.isEmailVerified,
        createdAt: req.user!.createdAt,
      }),
    );
  },
);

// POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.user!._id, {
    refreshToken: null, // Step 1 — Remove refresh token from DB, So even if someone has the old token, it's invalid on the server side
  });

  const isProduction = process.env.NODE_ENV === "production";

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
  // Step 1 — pull the raw token from the query string
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Verification token is required");
  }

  // Step 2 — hash the incoming raw token THE SAME WAY we hashed it at registration
  // we never stored the raw token anywhere — only the hash
  // so to find a match, we must hash again and compare hash-to-hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Step 3 — find a user with this exact hashed token, that hasn't expired yet
  // doing both checks in ONE query is more efficient than finding then checking separately
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: new Date() },
    //                              ↑
    //                  $gt = "greater than" — expiry must be in the FUTURE
    //                  if expiry already passed, this query finds nothing
  }).select("+emailVerificationToken +emailVerificationTokenExpiry");

  if (!user) {
    // could mean: wrong token, already used token, or expired token
    // deliberately vague — same principle as login errors
    throw new ApiError(400, "Verification link is invalid or has expired");
  }

  // Step 4 — mark verified, wipe the token fields
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;
  //          ↑
  //  CRITICAL — wipe both fields after success
  //  this token is single-use. if you don't clear it, someone could
  //  theoretically reuse the same link (until it naturally expires)

  await user.save({ validateBeforeSave: false });

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

    // deliberately vague here too — don't confirm/deny if an email exists in your system
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
      // ← same response whether user exists or not
      // this prevents attackers from using this endpoint to discover registered emails
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, "This email is already verified");
    }

    // generate a FRESH token pair — old one (if any) is now meaningless
    const { rawToken, hashedToken } = generateVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user, rawToken);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "If an account exists, a verification email has been sent",
        ),
      );
  },
);

// PATCH /api/auth/change-password
// For logged-in users who know their current password and want to change it
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    // Pull the hashed password — select:false means we must request it explicitly
    const user = await User.findById(req.user!._id).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    // Google OAuth users have no password — they can't use this endpoint
    if (!user.password) {
      throw new ApiError(
        400,
        "Your account uses Google sign-in. Password change is not available.",
      );
    }
    // Verify current password before allowing any change
    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordCorrect) {
      throw new ApiError(401, "Current password is incorrect");
    }
    // Hash and save the new password
    user.password = await bcrypt.hash(newPassword, 12);

    user.passwordChangedAt = new Date();
    // Wipe all refresh tokens — forces re-login on every other device
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";
    // Clear cookies on current device too — user must log in again
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

    const user = await User.findOne({ email });

    // security: same response whether or not the user exists
    // never let this endpoint leak which emails are registered — that's an enumeration attack
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
    user.passwordResetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min — matches email copy
    await user.save({ validateBeforeSave: false });

    // pass the whole user object, not just the email —
    // sendPasswordResetEmail needs user.name for the greeting, same as sendVerificationEmail does
    await sendPasswordResetEmail(user, rawToken);

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
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    // hash the incoming raw token the same way generateResetToken hashed it at creation —
    // we never store raw tokens, only hashes, so we compare hash-to-hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: new Date() }, // must still be within the 15-min window
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token.");
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    // burn the token — one-time use, exactly like the verification token flow
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;

    // force logout everywhere — if someone needed a password reset,
    // don't leave old refresh tokens (possibly attacker-held) still valid
    user.refreshToken = undefined;

    await user.save();

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
