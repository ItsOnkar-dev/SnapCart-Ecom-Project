import { Request, Response, Router } from "express";
import mongoose from "mongoose";

const router = Router();

// GET /health
// Liveness probe — is the process alive?
// Render/Railway hits this to decide if the container needs restarting.
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "UP",
    service: "SnapCart API",
    environment: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()), // seconds since server started
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
  });
});

// GET /ready
// Readiness probe — is the server ready to serve traffic?
// Checks DB connection. Returns 503 if DB is down.
// Render waits for 200 here before routing traffic to this instance.
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
