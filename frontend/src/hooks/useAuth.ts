// All auth mutations + seller apply.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
  changePasswordApi,
  forgotPasswordApi,
  loginApi,
  logoutApi,
  registerApi,
  resendVerificationApi,
  resetPasswordApi,
  verifyEmailApi,
} from "@/api/auth.api";
import { applyAsSellerApi } from "@/api/seller.api";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/types/api.types";

import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/types/auth.types";

// POST /auth/login → { email, password }
// Server sets httpOnly cookies. Then we call initAuth()
// to populate Zustand from /auth/me.
export function useLogin() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: LoginInput & { redirectTo?: string }) =>
      loginApi({ email: body.email, password: body.password }),
    onSuccess: async (_data, variables) => {
      await initAuth();
      toast.success("Welcome back!");
      navigate(variables.redirectTo ?? "/");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Login failed. Try again."));
    },
  });
}

// POST /auth/register → { name, email, password }
// Not logged in after this — verification email sent first.
export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: RegisterInput) => registerApi(body),
    onSuccess: (res) => {
      const demoVerificationUrl = res.data?.data?.demoVerificationUrl;
      toast.success(
        demoVerificationUrl
          ? "Account created! Use demo verification to continue."
          : "Account created! Check your email to verify.",
      );
      navigate("/verify-email", {
        state: { demoVerificationUrl },
      });
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Registration failed. Try again."));
    },
  });
}

// POST /auth/logout — server clears httpOnly cookies.
// We clear Zustand + query cache regardless of server response.
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success("Logged out.");
      navigate("/login");
    },
    onError: () => {
      // Server failed but still clear local state — stuck session is worse
      clearAuth();
      queryClient.clear();
      navigate("/login");
    },
  });
}

// GET /auth/verify-email?token=<token>
// Token extracted from URL params in VerifyEmailPage,
// passed into this mutation as a plain string.
export function useVerifyEmail() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (token: string) => verifyEmailApi(token),
    onSuccess: () => {
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Verification failed or link expired."),
      );
    },
  });
}

// POST /auth/resend-verification
// Takes raw email string — api function wraps it in { email }.
export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => resendVerificationApi(email),
    onSuccess: (res) => {
      const demoVerificationUrl = res.data?.data?.demoVerificationUrl;
      toast.success(
        demoVerificationUrl
          ? "Demo verification link is ready."
          : "Verification email resent. Check your inbox.",
      );
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Could not resend. Try again later."),
      );
    },
  });
}

// POST /auth/forgot-password → { email }
// Toast is intentionally vague — prevents email enumeration.
export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: ForgotPasswordInput) => forgotPasswordApi(body),
    onSuccess: () => {
      toast.success("If that email exists, a reset link has been sent.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Request failed. Try again."));
    },
  });
}

// POST /auth/reset-password → { token, newPassword }
// key is newPassword not password — confirmed from controller.
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: ResetPasswordInput) => resetPasswordApi(body),
    onSuccess: () => {
      toast.success("Password reset! Log in with your new password.");
      navigate("/login");
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(err, "Reset failed. Link may be expired."),
      );
    },
  });
}

// PATCH /auth/change-password → { currentPassword, newPassword }
// Logged-in users only. No redirect — stays on settings page.
export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordInput) => changePasswordApi(body),
    onSuccess: () => {
      toast.success("Password updated.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Could not update password."));
    },
  });
}

// POST /seller/apply — no body (confirmed from controller)
// Re-runs initAuth so Zustand picks up sellerStatus: "pending"
export function useApplyForSeller() {
  const initAuth = useAuthStore((s) => s.initAuth);

  return useMutation({
    mutationFn: () => applyAsSellerApi(),
    onSuccess: async () => {
      await initAuth();
      toast.success("Application submitted! Pending admin review.");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Application failed. Try again."));
    },
  });
}
