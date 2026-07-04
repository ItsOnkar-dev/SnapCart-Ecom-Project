import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { useLogin } from "../../hooks/useAuth";
import { loginSchema, type LoginFormData } from "../../schemas/auth.schema";

const LoginPage = () => {
  const location = useLocation();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const redirectTo =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/";

  const onSubmit = (values: LoginFormData) => {
    loginMutation.mutate({ ...values, redirectTo });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(192,132,252,0.25),transparent_35%),linear-gradient(135deg,#fdfbff_0%,#f5f3ff_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-[0_25px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative flex flex-col justify-between bg-gradient-to-br from-fuchsia-600 via-violet-600 to-sky-500 p-8 text-white sm:p-10">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur">
                Welcome back to SnapCart
              </div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Shop smarter, faster, and with confidence.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-fuchsia-50 sm:text-base">
                Sign in to discover curated deals, track your orders, and keep
                your cart ready for checkout in seconds.
              </p>
            </div>

            <div className="mt-10 space-y-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              {[
                "Fast checkout and saved carts",
                "Secure account access and order tracking",
                "Personalized recommendations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-600">
                Sign in
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Access your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your details to continue shopping.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-violet-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="font-medium text-violet-600 transition hover:text-violet-700"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? "Signing you in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              New here?{" "}
              <Link
                to="/register"
                className="font-semibold text-violet-600 transition hover:text-violet-700"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
