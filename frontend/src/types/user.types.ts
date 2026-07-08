export type UserRole = "customer" | "seller" | "admin";

export type SellerStatus = "none" | "pending" | "approved" | "rejected";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  sellerStatus?: SellerStatus;
  avatar?: string;
  createdAt: string;
}

// what the backend returns from /auth/login, /auth/register, /auth/me
export interface AuthResponse {
  user: User;
}
