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
  emailVerificationToken?: string; // optional — only exists during verification
  emailVerificationTokenExpiry?: Date; // optional — only exists during verification
  passwordResetToken?: string; // optional — only exists during reset flow
  passwordResetTokenExpiry?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
