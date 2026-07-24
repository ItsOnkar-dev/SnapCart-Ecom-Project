import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiResponse";

const doubleSubmitCookie = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const method = req.method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    next();
    return;
  }

  const tokenFromHeader = req.get("x-csrf-token");
  const tokenFromBody = req.body?.csrfToken;
  const tokenFromQuery = req.query?.csrfToken;

  const providedToken =
    typeof tokenFromHeader === "string"
      ? tokenFromHeader
      : typeof tokenFromBody === "string"
        ? tokenFromBody
        : typeof tokenFromQuery === "string"
          ? tokenFromQuery
          : undefined;

  const cookieToken = req.cookies?.csrfToken;

  if (
    !providedToken ||
    !cookieToken ||
    providedToken.length !== cookieToken.length ||
    !crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(cookieToken),
    )
  ) {
    next(new ApiError(403, "Session expired. Please refresh and try again."));
    return;
  }

  next();
};

export const csrfProtection = doubleSubmitCookie;
