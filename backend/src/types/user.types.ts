import { Document } from "mongoose";

export type UserRole = "customer" | "seller" | "admin";
export type SellerStatus = "none" | "pending" | "approved" | "rejected";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  sellerStatus: SellerStatus;
  sellerApplication?: {
    storeName: string;
    contactEmail: string;
    contactPhone?: string;
    taxId?: string;
    businessAddress?: string;
    storeDescription?: string;
    appliedAt?: Date;
  };
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
