import { NextFunction, Request, Response } from "express";

// Wraps async route handlers so you don't need try/catch in every controller
// Instead of: try { ... } catch(err) { next(err) } in every function
// You just: export const register = asyncHandler(async (req, res) => { ... })
type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next); // if anything throws, sends error to Express error handler
  };
};
