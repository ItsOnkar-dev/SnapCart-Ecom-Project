import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/generateTokens";

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
  // bcrypt.hash(password, saltRounds) — 12 rounds is industry standard for 2024
  const hashedPassword = await bcrypt.hash(password, 12);

  // Step 6 — Create the user in DB
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    // role defaults to "customer" (set in schema)
    // isActive defaults to true (set in schema)
  });

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
    .json(new ApiResponse(201, "Account created successfully", userResponse));
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

  // Step 8 — Cookie config
  const cookieOptions = {
    httpOnly: true, // browser JS cannot read this cookie — blocks XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod, HTTP allowed in dev
    sameSite: "strict" as const, // cookie only sent to your own domain — blocks CSRF
  };

  // Step 9 — Attach cookies to response and send user data
  res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes in ms
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    })
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
// verifyToken runs before this — so we know exactly who is logging out
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Step 1 — Remove refresh token from DB
  // So even if someone has the old token, it's invalid on the server side
  await User.findByIdAndUpdate(req.user!._id, {
    refreshToken: null,
  });

  // Step 2 — Clear both cookies from browser
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "Logged out successfully"));
});
