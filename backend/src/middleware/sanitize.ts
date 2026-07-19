// src/middleware/sanitize.ts

import { NextFunction, Request, Response } from "express";

// Recursively strips keys that start with $ or contain dots —
// the two patterns MongoDB injection relies on.
function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      if (key.startsWith("$") || key.includes(".")) return acc; // drop the key entirely
      const val = obj[key];
      acc[key] =
        val && typeof val === "object" && !Array.isArray(val)
          ? sanitize(val as Record<string, unknown>)
          : val;
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

export const mongoSanitize = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // Express 5 makes req.query a getter — never assign to it directly.
  // Instead, shadow it on the request object via Object.defineProperty.
  if (req.query && Object.keys(req.query).length) {
    Object.defineProperty(req, "query", {
      value: sanitize(req.query as Record<string, unknown>),
      writable: true,
      configurable: true,
    });
  }
  if (req.body && typeof req.body === "object") {
    req.body = sanitize(req.body);
  }
  next();
};
