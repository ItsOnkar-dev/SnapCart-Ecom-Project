// pages/auth/LoginPage.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mutate: login, isPending } = useLogin();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShoppingBag className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">
            Snap<span className="text-primary">cart</span>
          </span>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to your account to continue
          </p>

          <form
            onSubmit={handleSubmit((data) => login(data))}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/google`}
              className="flex items-center gap-2"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-4 h-4"
              />
              Continue with Google
            </a>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary font-medium hover:text-primary/80"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
