import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser } from "../types/user.types";
import { ApiError } from "../utils/ApiResponse";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Decoded shape of your access token (matches what you put inside generateAccessToken)
interface DecodedToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

// Reads accessToken cookie → verifies it → attaches user to req.user
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Step 1 — Read the accessToken cookie
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "You are not logged in");
  }

  // Step 2 — Verify the token is valid and not expired
  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
    ) as DecodedToken;
  } catch (err) {
    throw new ApiError(401, "Session expired, please login again");
  }

  // Step 3 — Find the user in DB using the id inside the token
  const user = await User.findById(decoded.userId).select("+passwordChangedAt");

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // ── Token invalidation after password change
  if (user.passwordChangedAt) {
    const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (decoded.iat < changedAt) {
      throw new ApiError(
        401,
        "Password was recently changed. Please log in again.",
      );
    }
  }

  // Step 4 — Attach user to request so any route after this can use req.user
  req.user = user;

  // Step 5 — Pass control to the next middleware or route handler
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // req.user is guaranteed here because verifyToken ran first
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${roles.join(" or ")}`,
      );
    }

    next();
  };
};
