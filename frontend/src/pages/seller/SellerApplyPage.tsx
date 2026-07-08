import { Loader2, Store } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplyForSeller } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import type { SellerApplicationInput } from "@/types/seller.types";

const emptyForm: SellerApplicationInput = {
  storeName: "",
  contactEmail: "",
  contactPhone: "",
  taxId: "",
  businessAddress: "",
  storeDescription: "",
};

export default function SellerApplyPage() {
  const user = useAuthStore((state) => state.user);
  const { mutate: apply, isPending } = useApplyForSeller();
  const [form, setForm] = useState<SellerApplicationInput>({
    ...emptyForm,
    contactEmail: user?.email ?? "",
  });

  const sellerStatus = user?.role === "seller" ? "approved" : user?.sellerStatus ?? "none";
  const isBlocked = sellerStatus === "pending" || sellerStatus === "approved";

  const updateField = (field: keyof SellerApplicationInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply(form);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <div className="mb-5 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Become a seller
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Start selling on Snapcart. Submit your business details and our team will review your application.
          </p>
        </div>

        {!user?.isEmailVerified && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
            Please verify your email before applying to become a seller.
            <Button asChild variant="link" className="ml-2 px-0 text-amber-100">
              <Link to="/verify-email">Verify email</Link>
            </Button>
          </div>
        )}

        {isBlocked ? (
          <section className="rounded-xl border border-border bg-card p-8">
            <h2 className="text-2xl font-semibold text-foreground">
              {sellerStatus === "pending" ? "Application under review" : "You are already a seller"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {sellerStatus === "pending"
                ? "Your seller application has been submitted. You will see seller tools once an admin approves it."
                : "Your account already has seller access."}
            </p>
            <Button asChild className="mt-6 rounded-none">
              <Link to="/profile">Back to account</Link>
            </Button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            <Field label="Store name *">
              <Input
                required
                value={form.storeName}
                onChange={(event) => updateField("storeName", event.target.value)}
                className="h-12 rounded-none"
              />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Contact email *">
                <Input
                  required
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => updateField("contactEmail", event.target.value)}
                  className="h-12 rounded-none"
                />
              </Field>
              <Field label="Contact phone">
                <Input
                  value={form.contactPhone}
                  onChange={(event) => updateField("contactPhone", event.target.value)}
                  className="h-12 rounded-none"
                />
              </Field>
            </div>

            <Field label="Business / tax ID">
              <Input
                value={form.taxId}
                onChange={(event) => updateField("taxId", event.target.value)}
                className="h-12 rounded-none"
              />
            </Field>

            <Field label="Business address">
              <textarea
                value={form.businessAddress}
                onChange={(event) => updateField("businessAddress", event.target.value)}
                className="min-h-28 w-full rounded-none border border-input bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </Field>

            <Field label="Tell us about your store">
              <textarea
                value={form.storeDescription}
                onChange={(event) => updateField("storeDescription", event.target.value)}
                className="min-h-32 w-full rounded-none border border-input bg-background px-3 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </Field>

            <Button
              type="submit"
              disabled={isPending || !user?.isEmailVerified}
              className="h-14 w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit application"
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
