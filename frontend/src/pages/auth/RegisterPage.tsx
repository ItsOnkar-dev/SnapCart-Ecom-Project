// pages/auth/RegisterPage.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail, User } from "lucide-react";
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
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-light text-center text-foreground mb-2">
          Create account
        </h1>

        <p className="text-sm font-light text-center text-muted-foreground mb-8">
          Join Snapcart to save your bag, favourites and orders.
        </p>

        {/* Google */}
        <Button
          variant="outline"
          className="w-full h-10 rounded-none font-light mb-6"
          asChild
        >
          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            className="flex items-center justify-center gap-2"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-4 h-4"
            />
            Continue with Google
          </a>
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-light text-foreground"
            >
              Full name
            </label>

            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                {...field("name")}
                placeholder="John Doe"
                className="pl-10 rounded-none"
              />
            </div>

            {errors.name && (
              <p className="mt-2 text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-light text-foreground"
            >
              Email
            </label>

            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...field("email")}
                placeholder="you@example.com"
                className="pl-10 rounded-none"
              />
            </div>

            {errors.email && (
              <p className="mt-2 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-5">
            <div>
              <label
                htmlFor="password"
                className="text-sm font-light text-foreground"
              >
                Password
              </label>

              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  {...field("password")}
                  placeholder="At least 8 characters"
                  className="pl-10 rounded-none"
                />
              </div>

              {errors.password && (
                <p className="mt-2 text-xs text-destructive">
                  {errors.password.message}
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
                  {...field("confirmPassword")}
                  placeholder="••••••••"
                  className="pl-10 rounded-none"
                />
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-light text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-foreground underline hover:no-underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-8 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
