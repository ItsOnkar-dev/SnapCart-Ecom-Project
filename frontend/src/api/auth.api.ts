import { api } from "@/lib/axios";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/types/auth.types";

// ── auth api functions ────────────────────────────────────────────────────────

// POST /api/auth/register — creates account, sends verification email, no cookies set
export const registerApi = (body: RegisterInput) =>
  api.post("/auth/register", body);

// POST /api/auth/login — sets accessToken + refreshToken cookies
export const loginApi = (body: LoginInput) => api.post("/auth/login", body);

// POST /api/auth/logout — clears both cookies, wipes refreshToken from DB
export const logoutApi = () => api.post("/auth/logout");

// GET /api/auth/me — reads accessToken cookie, returns current user
export const getMeApi = () => api.get("/auth/me");

// POST /api/auth/refresh — interceptor calls this, never call manually
export const refreshTokenApi = () => api.post("/auth/refresh");

// GET /api/auth/verify-email?token=xxx — token is a query param, confirmed GET
export const verifyEmailApi = (token: string) =>
  api.get("/auth/verify-email", { params: { token } });

// POST /api/auth/resend-verification — needs email in body, confirmed from controller
export const resendVerificationApi = (email: string) =>
  api.post("/auth/resend-verification", { email });

// POST /api/auth/forgot-password — rate limited 5 per 10 min
export const forgotPasswordApi = (body: ForgotPasswordInput) =>
  api.post("/auth/forgot-password", body);

// POST /api/auth/reset-password — field is newPassword confirmed from controller
export const resetPasswordApi = (body: ResetPasswordInput) =>
  api.post("/auth/reset-password", body);

// PATCH /api/auth/change-password — logged in user only
export const changePasswordApi = (body: ChangePasswordInput) =>
  api.patch("/auth/change-password", body);

// GET /api/auth/google — NOT axios, full page redirect to Google OAuth
export const getGoogleAuthUrl = () =>
  `${import.meta.env.VITE_API_URL}/auth/google`;
