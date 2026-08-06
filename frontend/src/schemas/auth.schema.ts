import { z } from "zod";
import {
  NAME_MAX,
  NAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "../../../backend/src/validation-constants";

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
      .min(NAME_MIN, `Name must be at least ${NAME_MIN} characters`)
      .max(NAME_MAX, `Name cannot exceed ${NAME_MAX} characters`),
    email: emailSchema,
    password: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, "Password is too long"),
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
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, "Password is too long"),
    confirmNewPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ── change password ───────────────────────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, "Password is too long"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
