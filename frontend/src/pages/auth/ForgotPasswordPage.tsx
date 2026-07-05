// pages/auth/ForgotPasswordPage.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    forgotPassword(data, {
      onSuccess: () => setSubmitted(true),
    });
  };

  if (submitted) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-5" />

          <h1 className="text-2xl font-light text-foreground mb-2">
            Check your email
          </h1>

          <p className="text-sm font-light text-muted-foreground">
            If
            <span className="font-medium text-foreground">
              {" "}
              {getValues("email")}{" "}
            </span>
            is registered, we've sent you a password reset link.
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            The link expires in 15 minutes.
          </p>

          <Button asChild className="w-full h-12 rounded-none mt-8">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-light text-center text-foreground mb-2">
          Forgot password?
        </h1>

        <p className="text-sm font-light text-center text-muted-foreground mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            disabled={isPending}
            className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 font-light"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
