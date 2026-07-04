import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "../../hooks/useAuth";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const verifyEmailMutation = useVerifyEmail();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate(token);
    }
  }, [token, verifyEmailMutation]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.2),transparent_30%),linear-gradient(135deg,#f9fbff_0%,#eef2ff_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-4xl border border-white/70 bg-white/80 p-8 text-center shadow-[0_25px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-700">
            ✉
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Verify your email
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            We&apos;re confirming your address. If the link is still valid, your
            account will be verified automatically.
          </p>

          {verifyEmailMutation.isPending && (
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Verifying your email, please wait...
            </div>
          )}

          {verifyEmailMutation.isError && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              The verification link is invalid or has expired.
            </div>
          )}

          <Link
            to="/login"
            className="mt-8 inline-flex rounded-full bg-linear-to-r from-violet-600 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.01]"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
