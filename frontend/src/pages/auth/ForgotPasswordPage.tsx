// pages/auth/ForgotPasswordPage.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

import { useForgotPassword } from "@/hooks/useAuth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/auth.schema";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data, { onSuccess: () => setSubmitted(true) });
  };

  if (submitted) {
    return (
      <Shell>
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">
          Check your email
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-2">
          If{" "}
          <span className="font-medium text-gray-700">
            {getValues("email")}
          </span>{" "}
          is registered, a reset link is on its way.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Link expires in 15 minutes.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-7 h-7 text-indigo-600" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Forgot password?
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
          {isPending ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-1.5 mt-5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to login
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {children}
      </div>
    </div>
  );
}
