// schemas/auth.schema.ts
// Single source of truth for all auth form validation.
// Mirrors backend/src/validators/auth.validator.ts — keep in sync when backend rules change.
// Every auth page imports from here — no inline schemas anywhere.

import { z } from "zod";

// ── shared base ───────────────────────────────────────────────────────────────
// Reused across login, register, forgot — same email rules everywhere
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Please enter a valid email address",
  });

// ── login ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ── register ──────────────────────────────────────────────────────────────────
// confirmPassword is frontend-only — never sent to backend
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ── verify email ──────────────────────────────────────────────────────────────
// Used by the resend form on VerifyEmailPage — just needs an email
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type ResendVerificationFormData = z.infer<
  typeof resendVerificationSchema
>;

// ── forgot password ───────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ── reset password ────────────────────────────────────────────────────────────
// token comes from URL params — not part of the form, not validated here
// body sent to backend: { token, newPassword } — key is newPassword, confirmed from controller
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ── change password ───────────────────────────────────────────────────────────
// Used on the settings/profile page — logged-in users only
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
