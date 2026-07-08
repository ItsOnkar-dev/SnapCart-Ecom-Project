// pages/auth/VerifyEmailPage.tsx
// pages/auth/VerifyEmailPage.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  resendVerificationSchema,
  type ResendVerificationFormData,
} from "@/schemas/auth.schema";

import { useResendVerification, useVerifyEmail } from "@/hooks/useAuth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token");
  const initialDemoVerificationUrl =
    (location.state as { demoVerificationUrl?: string } | null)
      ?.demoVerificationUrl ?? "";

  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [demoVerificationUrl, setDemoVerificationUrl] = useState(
    initialDemoVerificationUrl,
  );

  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmail();

  const { mutate: resend, isPending: isResending } = useResendVerification();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
  });

  useEffect(() => {
    if (token) {
      verifyEmail(token, {
        onSuccess: () => setVerified(true),
        onError: () => setVerifyError(true),
      });
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- Loading ----------------

  if (token && isVerifying) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-5" />

          <h1 className="text-2xl font-light text-foreground mb-2">
            Verifying your email...
          </h1>

          <p className="text-sm font-light text-muted-foreground">
            Just a moment.
          </p>
        </div>
      </div>
    );
  }

  // ---------------- Success ----------------

  if (token && verified) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-5" />

          <h1 className="text-2xl font-light text-foreground mb-2">
            Email verified!
          </h1>

          <p className="text-sm font-light text-muted-foreground mb-8">
            Your account is now ready.
          </p>

          <Button
            asChild
            className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
          >
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ---------------- Invalid Token ----------------

  if (token && verifyError) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-5">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>

          <h1 className="text-2xl font-light text-center text-foreground mb-2">
            Link expired
          </h1>

          <p className="text-sm font-light text-center text-muted-foreground mb-8">
            Verification links expire after 10 minutes. Request a new one below.
          </p>

          <DemoVerificationLink demoVerificationUrl={demoVerificationUrl} />

          <ResendForm
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            isResending={isResending}
            onResend={({ email }) =>
              resend(email, {
                onSuccess: (res) =>
                  setDemoVerificationUrl(
                    res.data?.data?.demoVerificationUrl ?? "",
                  ),
              })
            }
          />
        </div>
      </div>
    );
  }

  // ── no token: user just registered ────────────────────────────────────────
  // ---------------- No Token (After Registration) ----------------

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-light text-center text-foreground mb-2">
          Check your email
        </h1>

        <p className="text-sm font-light text-center text-muted-foreground mb-8">
          We've sent you a verification link. It expires in 10 minutes.
        </p>

        <DemoVerificationLink demoVerificationUrl={demoVerificationUrl} />

        <ResendForm
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          isResending={isResending}
          onResend={({ email }) =>
            resend(email, {
              onSuccess: (res) =>
                setDemoVerificationUrl(
                  res.data?.data?.demoVerificationUrl ?? "",
                ),
            })
          }
        />

        <p className="mt-6 text-center text-sm font-light text-muted-foreground">
          Already verified?{" "}
          <Link
            to="/login"
            className="text-foreground underline hover:no-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function DemoVerificationLink({
  demoVerificationUrl,
}: {
  demoVerificationUrl?: string;
}) {
  if (!demoVerificationUrl) return null;

  return (
    <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
      <p className="mb-3 text-sm font-light text-muted-foreground">
        Demo mode is active, so you can verify without a paid email domain.
      </p>
      <Button
        asChild
        className="h-11 w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <a href={demoVerificationUrl}>Verify in demo mode</a>
      </Button>
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
    <form onSubmit={handleSubmit(onResend)} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-light text-foreground">
          Email
        </label>

        <div className="relative mt-2">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

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

      <Button
        type="submit"
        disabled={isResending}
        className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
      >
        {isResending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Resend verification link"
        )}
      </Button>
    </form>
  );
}
