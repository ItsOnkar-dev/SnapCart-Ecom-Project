import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Permission, ROLE_PERMISSIONS } from "../config/permissions";
import { env } from "../config/validateEnv";
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

interface DecodedToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "You are not logged in");
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(
        token,
        env.jwt.accessSecret as string,
      ) as DecodedToken;
    } catch {
      throw new ApiError(401, "Session expired, please login again");
    }

    const user = await User.findById(decoded.userId).select(
      "+passwordChangedAt",
    );

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        throw new ApiError(
          401,
          "Password was recently changed. Please log in again.",
        );
      }
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );
    }

    next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user!.role;
    const allowed = ROLE_PERMISSIONS[userRole] ?? [];
    if (!allowed.includes(permission)) {
      throw new ApiError(
        403,
        "You don't have permission to perform this action",
      );
    }
    next();
  };
};

export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user!.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email address before continuing",
    );
  }
  next();
};

export const optionalVerifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return next();
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(
        token,
        env.jwt.accessSecret as string,
      ) as DecodedToken;
    } catch {
      return next();
    }

    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (_error) {
    next();
  }
};
