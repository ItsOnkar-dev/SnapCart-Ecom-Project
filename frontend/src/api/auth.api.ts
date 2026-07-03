// This file is the single place that knows how to talk to the every auth backend or URL.
// Everything else just calls these functions — they don't know axios exists.

// WHAT THIS FILE DOES:
// Pure functions. No state. No hooks. No UI.
// Input goes in → axios call happens → raw response comes out.

import { api } from "../lib/axios";

// ── input types for what we SEND to the backend (form inputs) ──────────────────────
// these live here because they're tightly coupled to these specific API calls
// user.types.ts holds what comes BACK (the User shape)

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

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
