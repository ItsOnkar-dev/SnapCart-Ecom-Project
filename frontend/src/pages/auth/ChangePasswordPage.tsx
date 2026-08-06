// src/pages/auth/ChangePasswordPage.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/hooks/useAuth";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";

export default function ChangePasswordPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { mutate: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePassword(data, {
      onSuccess: () => {
        clearAuth();
        navigate("/login");
      },
    });
  };

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <Lock className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-light text-center text-foreground mb-2">
          Change password
        </h1>

        <p className="text-sm font-light text-center text-muted-foreground mb-8">
          Enter your current password and choose a new one. You will be signed
          out after the change.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="text-sm font-light text-foreground"
            >
              Current password
            </label>
            <div className="relative mt-2">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Current password"
                {...register("currentPassword")}
                className="rounded-none h-11"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none"
                aria-label={
                  showCurrentPassword ? "Hide password" : "Show password"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-2 text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="text-sm font-light text-foreground"
            >
              New password
            </label>
            <div className="relative mt-2">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                {...register("newPassword")}
                className="rounded-none h-11"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-2 text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmNewPassword"
              className="text-sm font-light text-foreground"
            >
              Confirm new password
            </label>
            <div className="relative mt-2">
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                {...register("confirmNewPassword")} // Register using the aligned schema key
                className="rounded-none h-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmNewPassword && ( // Read the aligned schema key error
              <p className="mt-2 text-xs text-destructive">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-none bg-foreground text-background hover:bg-foreground/90 font-medium cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            to="/profile"
            className="text-sm font-light text-muted-foreground hover:text-foreground"
          >
            Back to profile
          </Link>
        </p>
      </div>
    </div>
  );
}
