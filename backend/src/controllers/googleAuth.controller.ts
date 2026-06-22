import { Request, Response } from "express";
import { getGoogleClient } from "../config/googleClient";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/generateTokens";

// GET /api/auth/google
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const googleClient = getGoogleClient(); // ← create fresh here

  const googleAuthUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });

  res.redirect(googleAuthUrl);
});

// GET /api/auth/google/callback
// Step 2 — Google redirects back here with a code
export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const googleClient = getGoogleClient();
    // Step 1 — Get the code Google sent in the URL
    const { code } = req.query;

    if (!code) {
      throw new ApiError(
        400,
        "Google authentication failed — no code received",
      );
    }

    // Step 2 — Exchange code for tokens
    const { tokens } = await googleClient.getToken(code as string);
    googleClient.setCredentials(tokens);

    // Step 3 — Fetch user's profile from Google
    const userInfoResponse = await googleClient.request({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });

    // Step 4 — Extract what we need
    const googleUser = userInfoResponse.data as {
      id: string;
      email: string;
      name: string;
      picture: string;
      verified_email: boolean;
    };

    if (!googleUser.email) {
      throw new ApiError(400, "Could not retrieve email from Google");
    }

    // Step 5 — Find existing user or create new one
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // Already registered — just update their Google info
      user.googleId = googleUser.id;
      user.avatar = googleUser.picture;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    } else {
      // Brand new user — create account automatically
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        isEmailVerified: true,
        // no password — they login via Google only
      });
    }

    // Step 6 — Generate our JWT tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Step 7 — Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Step 8 — Set cookies and redirect to frontend
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      //   redirect(process.env.FRONTEND_URL);
      .json({
        success: true,
        message: "Google authentication successful",
        user,
      });
  },
);
