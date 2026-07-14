import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Initialize search parameters
  const { user } = useAuthStore();
  const { mutate: login, isPending } = useLogin();
  const location = useLocation();

  // Handle standard redirect if already logged in via state
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.state?.message) {
      toast.info(location.state.message);
    }
  }, [location]);

  // Handle Google Auth Redirect
  useEffect(() => {
    const authStatus = searchParams.get("googleAuth");
    const userName = searchParams.get("name");

    if (authStatus !== "success") return;

    const initializeGoogleLogin = async () => {
      try {
        // initAuth sets user in store — wait for it to finish
        await useAuthStore.getState().initAuth();

        // Check if user was actually set — if not, cookie didn't come through
        const user = useAuthStore.getState().user;
        if (!user) {
          toast.error("Google login failed. Please try again.");
          return;
        }

        toast.success(
          `Welcome back, ${decodeURIComponent(userName || "User")}!`,
        );
        navigate("/", { replace: true });
      } catch {
        toast.error("Google login failed. Please try again.");
      }
    };

    initializeGoogleLogin();
  }, [searchParams, navigate]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-light text-center text-foreground mb-2">
          Sign in
        </h1>

        <p className="text-sm font-light text-center text-muted-foreground mb-8">
          Welcome back to Snapcart.
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
        <form
          onSubmit={handleSubmit((data) => login(data))}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="text-sm font-light text-foreground"
            >
              Email
            </label>

            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className="pl-10 rounded-none"
              />
            </div>

            {errors.email && (
              <p className="mt-2 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-light text-foreground"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="pl-10 rounded-none"
              />
            </div>

            {errors.password && (
              <p className="mt-2 text-xs text-destructive">
                {errors.password.message}
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
                Please wait...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-sm font-light text-center text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-foreground underline hover:no-underline"
          >
            Create one
          </Link>
        </p>

        <p className="text-center mt-8">
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
