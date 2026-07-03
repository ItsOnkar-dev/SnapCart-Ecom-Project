export type UserRole = "customer" | "seller" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  createdAt: string;
}

// what the backend returns from /auth/login, /auth/register, /auth/me
export interface AuthResponse {
  user: User;
  accessToken: string;
}
