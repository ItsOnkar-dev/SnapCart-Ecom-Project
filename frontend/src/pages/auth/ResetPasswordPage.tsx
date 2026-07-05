// pages/auth/ResetPasswordPage.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Invalid or missing token
  if (!token) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-5" />

          <h1 className="text-2xl font-light text-foreground mb-2">
            Invalid reset link
          </h1>

          <p className="text-sm font-light text-muted-foreground mb-8">
            This password reset link is invalid or has already expired.
          </p>

          <Button asChild className="w-full h-12 rounded-none">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = ({ newPassword }: ResetPasswordFormData) => {
    resetPassword({
      token,
      newPassword,
    });
  };

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <Lock className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-light text-center text-foreground mb-2">
          Set new password
        </h1>

        <p className="text-sm font-light text-center text-muted-foreground mb-8">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="text-sm font-light text-foreground"
            >
              New password
            </label>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                id="newPassword"
                type="password"
                placeholder="At least 8 characters"
                {...register("newPassword")}
                className="pl-10 rounded-none"
              />
            </div>

            {errors.newPassword && (
              <p className="mt-2 text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-sm font-light text-foreground"
            >
              Confirm password
            </label>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="pl-10 rounded-none"
              />
            </div>

            {errors.confirmPassword && (
              <p className="mt-2 text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-light text-muted-foreground hover:text-foreground"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
