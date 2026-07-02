import { Document } from "mongoose";

export type UserRole = "customer" | "seller" | "admin";
export type SellerStatus = "none" | "pending" | "approved" | "rejected";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  sellerStatus: SellerStatus;
  isEmailVerified: boolean;
  googleId?: string;
  avatar?: string;
  refreshToken?: string;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  passwordChangedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
