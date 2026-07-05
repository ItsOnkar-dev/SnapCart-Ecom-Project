// pages/auth/RegisterPage.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail, ShoppingBag, User } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/useAuth";
import { registerSchema, type RegisterFormData } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mutate: register, isPending } = useRegister();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = ({ name, email, password }: RegisterFormData) => {
    register({ name, email, password });
  };

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
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Start shopping in seconds
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...field("name")}
                  type="text"
                  placeholder="John Doe"
                  className="pl-9"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...field("email")}
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
              <label className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...field("password")}
                  type="password"
                  placeholder="At least 8 characters"
                  className="pl-9"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...field("confirmPassword")}
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
