// pages/auth/VerifyEmailPage.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";

import { useResendVerification, useVerifyEmail } from "@/hooks/useAuth";
import {
  resendVerificationSchema,
  type ResendVerificationFormData,
} from "@/schemas/auth.schema";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState(false);

  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmail();
  const { mutate: resend, isPending: isResending } = useResendVerification();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
  });

  // Auto-trigger when token is in URL
  useEffect(() => {
    if (token) {
      verifyEmail(token, {
        onSuccess: () => setVerified(true),
        onError: () => setVerifyError(true),
      });
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── token present: verifying ───────────────────────────────────────────────
  if (token && isVerifying) {
    return (
      <Shell>
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">
          Verifying your email...
        </h1>
        <p className="text-sm text-gray-500 mt-1">Just a moment.</p>
      </Shell>
    );
  }

  if (token && verified) {
    return (
      <Shell>
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">Email verified!</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Your account is ready.
        </p>
        <Link
          to="/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white
                     text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Go to login
        </Link>
      </Shell>
    );
  }

  if (token && verifyError) {
    return (
      <Shell>
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">
          Link expired or invalid
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Verification links expire after 10 minutes. Request a new one below.
        </p>
        <ResendForm
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          isResending={isResending}
          onResend={({ email }) => resend(email)}
        />
      </Shell>
    );
  }

  // ── no token: user just registered ────────────────────────────────────────
  return (
    <Shell>
      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="w-7 h-7 text-indigo-600" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900">Check your email</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        We sent a verification link to your email. It expires in 10 minutes.
      </p>
      <ResendForm
        register={register}
        handleSubmit={handleSubmit}
        errors={errors}
        isResending={isResending}
        onResend={({ email }) => resend(email)}
      />
      <p className="text-xs text-gray-400 mt-4">
        Already verified?{" "}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
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

function ResendForm({
  register,
  handleSubmit,
  errors,
  isResending,
  onResend,
}: {
  register: ReturnType<typeof useForm<ResendVerificationFormData>>["register"];
  handleSubmit: ReturnType<
    typeof useForm<ResendVerificationFormData>
  >["handleSubmit"];
  errors: ReturnType<
    typeof useForm<ResendVerificationFormData>
  >["formState"]["errors"];
  isResending: boolean;
  onResend: (data: ResendVerificationFormData) => void;
}) {
  return (
    <form onSubmit={handleSubmit(onResend)} className="text-left">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            {...register("email")}
            type="email"
            placeholder="Enter your email"
            className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       placeholder:text-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={isResending}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700
                     disabled:opacity-60 disabled:cursor-not-allowed text-white
                     text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {isResending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isResending ? "Sending..." : "Resend link"}
        </button>
      </div>
      {errors.email && (
        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
      )}
    </form>
  );
}
