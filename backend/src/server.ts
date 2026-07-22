import "dotenv/config";
import app from "./app";
import http from "http";
import { connectDB } from "./config/db";
import { validateEnv } from "./config/validateEnv";
import { Logger } from "./utils/logger";

validateEnv();

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI!);

    const server = http.createServer(app);

    server.listen(PORT, () => {
      Logger.info(`🚀 Server running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      Logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        Logger.info("HTTP server closed");
        process.exit(0);
      });

      // Force exit if graceful shutdown takes longer than 10s
      setTimeout(() => {
        Logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      Logger.error("Unhandled rejection:", reason);
    });

    process.on("uncaughtException", (err) => {
      Logger.error("Uncaught exception:", err);
      process.exit(1);
    });
  } catch (error) {
    Logger.error("❌ Failed to start server:", error);

    process.exit(1);
  }
};

startServer();
