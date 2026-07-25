import bcrypt from "bcryptjs";
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/user.model";
import { Logger } from "../utils/logger";

const bootstrapAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    Logger.error(
      "❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables",
    );
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    Logger.error("❌ ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  try {
    Logger.info("🔄 Connecting to MongoDB...");
    await connectDB(process.env.MONGO_URI!);

    // Check if a primary admin (role "admin") already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      Logger.info(
        `✅ Primary admin already exists (${existingAdmin.email}). Exiting.`,
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    // No primary admin exists — check if the ADMIN_EMAIL user already exists
    const existingUser = await User.findOne({
      email: adminEmail.toLowerCase().trim(),
    });

    if (existingUser) {
      // Promote existing user to primary admin
      existingUser.role = "admin";
      existingUser.isEmailVerified = true;
      await existingUser.save({ validateBeforeSave: false });
      Logger.info(
        `✅ Promoted ${adminEmail} to primary administrator.`,
      );
    } else {
      // Create new admin account
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: "Administrator",
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
        isEmailVerified: true,
      });
      Logger.info(
        `✅ Primary administrator created (${adminEmail}).`,
      );
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      Logger.error("❌ Bootstrap failed:", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      Logger.error("❌ Bootstrap failed:", error);
    }
    process.exit(1);
  }
};

bootstrapAdmin();
