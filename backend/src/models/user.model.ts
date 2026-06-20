import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    sellerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
