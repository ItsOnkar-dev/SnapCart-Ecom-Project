import { Request, Response } from "express";
import { getGoogleClient } from "../config/googleClient";
import { env } from "../config/validateEnv";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens";
import { hashToken } from "../utils/hashToken";

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
export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const googleClient = getGoogleClient();
    const { code } = req.query;

    if (!code) {
      throw new ApiError(400, "Google sign-in failed. Please try again.");
    }

    const { tokens } = await googleClient.getToken(code as string);
    googleClient.setCredentials(tokens);

    const userInfoResponse = await googleClient.request({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
    });

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

    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      user.googleId = googleUser.id;
      user.avatar = googleUser.picture;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        isEmailVerified: true,
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Step 8 — Set cookies and redirect to frontend
    const isProduction = env.nodeEnv === "production";
    const frontendUrl = env.frontendUrl || "http://localhost:5173";

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

    const userName = encodeURIComponent(user.name);

    return res
      .cookie("accessToken", accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
      .redirect(`${frontendUrl}/login?googleAuth=success&name=${userName}`);
  },
);
