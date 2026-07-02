import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";
import { validateEnv } from "./config/validateEnv";
import { Logger } from "./utils/logger";

dotenv.config();

validateEnv();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI!);

    app.listen(PORT, () => {
      Logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    Logger.error("❌ Failed to start server:", error);

    process.exit(1);
  }
};

startServer();
