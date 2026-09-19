import SellerHeader from "@/components/layout/header/SellerHeader";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplyForSeller } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import type { SellerApplicationInput } from "@/types/seller.types";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const EMPTY_FORM: SellerApplicationInput = {
  storeName: "",
  contactEmail: "",
  contactPhone: "",
  taxId: "",
  businessAddress: "",
  storeDescription: "",
};

const STEPS = [
  {
    id: 1,
    label: "Store",
    title: "Your Store Identity",
    description: "What will you be known for?",
    context:
      "Choose a name buyers will remember. Your store name is the first thing they see — make it clear, not clever.",
    trust: "You can update your store name later from your dashboard.",
  },
  {
    id: 2,
    label: "Contact",
    title: "Contact Details",
    description: "How can buyers and our team reach you?",
    context:
      "We use your contact details to send order notifications and to reach you during the review process.",
    trust: "Your phone number is never shown publicly to buyers.",
  },
  {
    id: 3,
    label: "Business",
    title: "Business Verification",
    description: "A few details to verify your business.",
    context:
      "We verify every seller to keep SnapCart trustworthy. This takes less than 48 hours.",
    trust:
      "Your business details are encrypted and never shared with third parties.",
  },
];

export default function SellerApplyPage() {
  const user = useAuthStore((state) => state.user);
  const { mutate: apply, isPending } = useApplyForSeller();

  const [form, setForm] = useState<SellerApplicationInput>({
    ...EMPTY_FORM,
    contactEmail: user?.email ?? "",
  });
  const [phase, setPhase] = useState<"landing" | "form" | "success">("landing");
  const [step, setStep] = useState(1);

  const sellerStatus =
    user?.role === "seller" ? "approved" : (user?.sellerStatus ?? "none");
  const isBlocked = sellerStatus === "pending" || sellerStatus === "approved";

  const update = (field: keyof SellerApplicationInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScrollToTop />
        <SellerHeader />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm border border-border bg-card rounded-xl p-10 text-center space-y-5">
            {sellerStatus === "approved" ? (
              <CheckCircle className="size-12 mx-auto text-foreground" />
            ) : (
              <div className="size-12 mx-auto rounded-full border-2 border-foreground border-t-transparent animate-spin" />
            )}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {sellerStatus === "pending"
                  ? "Application Under Review"
                  : "Already a Seller"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {sellerStatus === "pending"
                  ? "Your application is being reviewed. You'll get seller tools once an admin approves it."
                  : "Your account already has full seller access."}
              </p>
            </div>
            <Button asChild className="w-full rounded-none">
              <Link to="/profile">Back to Account</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <ScrollToTop />
        <SellerHeader />
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-grid size-16 place-items-center rounded-xl bg-foreground text-background mx-auto">
                <CheckCircle className="size-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Application submitted
                </h1>
                <p className="text-sm text-muted-foreground">
                  We've received your seller application and will review it
                  within 48 hours.
                </p>
              </div>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  What happens next
                </p>
              </div>
              <div className="divide-y divide-border">
                {[
                  {
                    icon: <Clock className="size-4" />,
                    title: "We review your details",
                    sub: "Our team verifies your business info — usually within 24–48 hrs",
                  },
                  {
                    icon: <Mail className="size-4" />,
                    title: "You get an email",
                    sub: "We'll send next steps and your approval status to your inbox",
                  },
                  {
                    icon: <Store className="size-4" />,
                    title: "Your store goes live",
                    sub: "Start listing products and reaching buyers on SnapCart",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-6 py-4">
                    <div className="shrink-0 mt-0.5 text-muted-foreground">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              asChild
              className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90"
            >
              <Link to="/seller/dashboard">Explore seller dashboard →</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScrollToTop />
      <SellerHeader />

      {phase === "form" && (
        <div className="h-0.5 bg-border shrink-0">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      )}

      <main className="flex-1 px-6 py-12 md:py-20">
        <div
          className={`mx-auto ${phase === "landing" ? "max-w-4xl" : "max-w-lg"}`}
        >
          {phase === "landing" ? (
            <Landing
              onStart={() => setPhase("form")}
              isEmailVerified={user?.isEmailVerified}
            />
          ) : (
            <FormWizard
              form={form}
              step={step}
              isPending={isPending}
              isEmailVerified={user?.isEmailVerified}
              update={update}
              onNext={() => step < STEPS.length && setStep(step + 1)}
              onBack={() =>
                step > 1 ? setStep(step - 1) : setPhase("landing")
              }
              onSubmit={() =>
                apply(form, {
                  onSuccess: () => setPhase("success"),
                })
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Landing({
  onStart,
  isEmailVerified,
}: {
  onStart: () => void;
  isEmailVerified?: boolean;
}) {
  return (
    <div className="space-y-14">
      <div className="flex flex-col items-center justify-center text-center space-y-7">
        <div className="inline-grid size-14 place-items-center rounded-xl bg-foreground text-background">
          <Store className="size-7" />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
            Open your store &{" "}
            <span className="font-normal text-muted-foreground">
              Reach everyone.
            </span>
          </h1>
          <p className="text-base text-muted-foreground max-w-lg leading-relaxed mx-auto">
            Three quick steps. No friction. Your products in front of buyers who
            are ready to purchase — starting today.
          </p>
        </div>

        {!isEmailVerified && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-600">
            ⚠️ Verify your email first —{" "}
            <Link to="/verify-email" className="underline font-medium">
              do it now →
            </Link>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={onStart}
            disabled={!isEmailVerified}
            className="h-14 px-10 rounded-none bg-foreground text-background hover:bg-foreground/90 font-semibold text-base group"
          >
            Start your application
            <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Join 2,400+ sellers already on SnapCart
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground mb-4">
          What's involved
        </p>
        <div className="space-y-2">
          {[
            {
              num: "01",
              title: "Name your store",
              sub: "Pick a store name and write a short description",
            },
            {
              num: "02",
              title: "Add your contact details",
              sub: "Email and phone so buyers can reach you",
            },
            {
              num: "03",
              title: "Confirm business info",
              sub: "Tax ID and address for verification",
            },
          ].map((item) => (
            <div
              key={item.num}
              className="group flex items-center gap-5 rounded-xl border border-border bg-card px-5 py-4 hover:border-foreground/25 transition-colors cursor-default"
            >
              <span className="w-8 shrink-0 text-xl font-black text-muted-foreground/20 select-none">
                {item.num}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/25 group-hover:text-muted-foreground/60 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            Icon: ShieldCheck,
            title: "Secure payouts",
            desc: "Protected earnings, every time.",
          },
          {
            Icon: Zap,
            title: "Instant setup",
            desc: "Go live in minutes.",
          },
          {
            Icon: TrendingUp,
            title: "Built to scale",
            desc: "Analytics for real growth.",
          },
        ].map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card px-4 py-5 flex flex-col items-center gap-2 text-center"
          >
            <Icon className="size-5 text-foreground" />
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormWizard({
  form,
  step,
  isPending,
  isEmailVerified,
  update,
  onNext,
  onBack,
  onSubmit,
}: {
  form: SellerApplicationInput;
  step: number;
  isPending: boolean;
  isEmailVerified?: boolean;
  update: (f: keyof SellerApplicationInput, v: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const current = STEPS[step - 1] ?? STEPS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {step === 1 ? "Back to overview" : "Previous step"}
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">
          Step {step} of {STEPS.length}
        </span>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-7 py-5 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Step {step} of {STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {current.description}
          </p>
        </div>

        <div className="px-7 py-7">
          {step === 1 && <StepStore form={form} update={update} />}
          {step === 2 && <StepContact form={form} update={update} />}
          {step === 3 && <StepBusiness form={form} update={update} />}
        </div>

        <div className="px-7 py-4 border-t border-border flex items-center justify-between bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {step < STEPS.length
              ? `${STEPS.length - step} step${STEPS.length - step !== 1 ? "s" : ""} left`
              : "Ready to submit"}
          </span>

          {step < STEPS.length ? (
            <Button
              onClick={onNext}
              className="h-10 px-7 rounded-none bg-foreground text-background hover:bg-foreground/90 group"
            >
              Continue
              <ArrowRight className="ml-2 size-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isPending || !isEmailVerified}
              className="h-10 px-7 rounded-none bg-foreground text-background hover:bg-foreground/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          🔒 {current.trust}
        </p>
      </div>

      {!isEmailVerified && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600 flex gap-3 items-start">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>
            Please verify your email before submitting.{" "}
            <Link to="/verify-email" className="underline font-medium">
              Verify now →
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}

function StepStore({
  form,
  update,
}: {
  form: SellerApplicationInput;
  update: (f: keyof SellerApplicationInput, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="Store name *" icon={<Store className="size-4" />}>
        <Input
          required
          autoFocus
          value={form.storeName}
          onChange={(e) => update("storeName", e.target.value)}
          placeholder="e.g. Apex Gadgets"
          className="h-12 rounded-none"
        />
      </Field>
      <Field
        label="Tell us about your store"
        icon={<FileText className="size-4" />}
        hint="What do you sell? Who are your customers?"
      >
        <textarea
          value={form.storeDescription}
          onChange={(e) => update("storeDescription", e.target.value)}
          rows={4}
          placeholder="We sell premium tech accessories and gadgets for professionals…"
          className="w-full rounded-none border border-input bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </Field>
    </div>
  );
}

function StepContact({
  form,
  update,
}: {
  form: SellerApplicationInput;
  update: (f: keyof SellerApplicationInput, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="Contact email *" icon={<Mail className="size-4" />}>
        <Input
          required
          autoFocus
          type="email"
          value={form.contactEmail}
          onChange={(e) => update("contactEmail", e.target.value)}
          className="h-12 rounded-none"
        />
      </Field>
      <Field label="Contact phone" icon={<Phone className="size-4" />}>
        <Input
          value={form.contactPhone}
          onChange={(e) => update("contactPhone", e.target.value)}
          placeholder="+91 98765 43210"
          className="h-12 rounded-none"
        />
      </Field>
    </div>
  );
}

function StepBusiness({
  form,
  update,
}: {
  form: SellerApplicationInput;
  update: (f: keyof SellerApplicationInput, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Field
        label="Business / Tax ID"
        icon={<FileText className="size-4" />}
        hint="GSTIN, PAN, or equivalent business identifier"
      >
        <Input
          autoFocus
          value={form.taxId}
          onChange={(e) => update("taxId", e.target.value)}
          placeholder="e.g. 29ABCDE1234F1Z5"
          className="h-12 rounded-none"
        />
      </Field>
      <Field label="Business address" icon={<MapPin className="size-4" />}>
        <textarea
          value={form.businessAddress}
          onChange={(e) => update("businessAddress", e.target.value)}
          rows={4}
          placeholder="Full address including city, state, and PIN…"
          className="w-full rounded-none border border-input bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
      </span>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}
