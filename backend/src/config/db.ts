import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    console.log("✅ Successfully connected to database");
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);

    process.exit(1);
  }
};
