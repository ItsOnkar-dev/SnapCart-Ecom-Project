import mongoose from "mongoose";
import { Logger } from "../utils/logger";

export const connectDB = async (uri: string): Promise<void> => {
  await mongoose.connect(uri);

  Logger.info(
    `✅ Successfully connected to database: ${mongoose.connection.name}`,
  );
};
