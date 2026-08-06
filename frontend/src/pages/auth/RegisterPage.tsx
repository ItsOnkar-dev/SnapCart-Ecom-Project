import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/useAuth";
import { registerSchema, type RegisterFormData } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // <-- Initialize search parameters
  const { user } = useAuthStore();
  const { mutate: register, isPending } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle standard redirect if already logged in via state
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Catch Google Auth Redirect (Just like LoginPage)
  useEffect(() => {
    const authStatus = searchParams.get("googleAuth");
    const userName = searchParams.get("name");

    if (authStatus === "success") {
      toast.success(`Welcome to Snapcart, ${userName || "User"}!`, {
        duration: 4000,
        position: "top-center",
      });

      navigate("/", { replace: true });
    } else if (authStatus === "error") {
      toast.error("Google authentication failed. Please try again.");
    }
  }, [searchParams, navigate]);

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

        {/* Google Sign In */}
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
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  type={showPassword ? "text" : "password"}
                  {...field("password")}
                  placeholder="••••••••"
                  className="pl-10 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
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
                  type={showConfirmPassword ? "text" : "password"}
                  {...field("confirmPassword")}
                  placeholder="••••••••"
                  className="pl-10 rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
