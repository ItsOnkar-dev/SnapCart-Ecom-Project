// pages/auth/ResetPasswordPage.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";

import { useResetPassword } from "@/hooks/useAuth";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/schemas/auth.schema";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // No token in URL — link is broken or already used
  if (!token) {
    return (
      <Shell>
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">
          Invalid reset link
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          This link is missing a token. Please request a new password reset.
        </p>
        <Link
          to="/forgot-password"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white
                     text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Request new link
        </Link>
      </Shell>
    );
  }

  const onSubmit = ({ newPassword }: ResetPasswordFormData) => {
    // token from URL + newPassword from form
    // key is newPassword not password — confirmed from resetPassword controller
    // confirmPassword stripped here — frontend-only field
    resetPassword({ token, newPassword });
  };

  return (
    <Shell>
      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7 text-indigo-600" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Set new password
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("newPassword")}
              type="password"
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("confirmPassword")}
              type="password"
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                     disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium
                     py-2.5 rounded-lg transition-colors"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </Shell>
  );
}

const inputClass =
  "w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {children}
      </div>
    </div>
  );
}
