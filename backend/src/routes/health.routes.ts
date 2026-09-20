import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { env } from "../config/validateEnv";

const router = Router();

// GET /health
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "UP",
    service: "SnapCart API",
    environment: env.nodeEnv,
    uptime: Math.floor(process.uptime()), // seconds since server started
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
  });
});

// GET /ready
router.get("/ready", (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isConnected = dbState === 1;

  if (!isConnected) {
    res.status(503).json({
      success: false,
      status: "NOT_READY",
      database: "DISCONNECTED",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "READY",
    database: "CONNECTED",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
