import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),

  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),

  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),

  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password is too long"),

    confirmPassword: z.string({ error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
