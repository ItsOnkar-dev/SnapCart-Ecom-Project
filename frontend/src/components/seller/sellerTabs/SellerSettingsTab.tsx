import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSellerProfile,
  useUpdateSellerProfile,
} from "@/hooks/useSellerProducts";
import { CheckCircle2, Loader2, Phone, ShieldCheck, Store } from "lucide-react";
import React, { useState } from "react";

type Form = {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  storeDescription: string;
};

export function SellerSettingsTab() {
  const { data: profile, isLoading } = useSellerProfile();
  const { mutate: update, isPending } = useUpdateSellerProfile();

  const [draft, setDraft] = useState<Partial<Form>>({});
  const form: Form = {
    storeName: profile?.storeName ?? "",
    contactEmail: profile?.contactEmail ?? "",
    contactPhone: profile?.contactPhone ?? "",
    businessAddress: profile?.businessAddress ?? "",
    storeDescription: profile?.storeDescription ?? "",
    ...draft,
  };

  const set = (field: keyof Form, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const hasChanges = Object.keys(draft).length > 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-xl bg-muted/60" />
        <Skeleton className="h-80 w-full rounded-xl bg-muted/60" />
        <Skeleton className="h-44 w-full rounded-xl bg-muted/60 md:col-span-2" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update(form, {
      onSuccess: () => {
        setDraft({});
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-border/70 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Store className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Store Profile
                </p>
                <p className="text-xs text-muted-foreground">
                  Public storefront information visible to buyers
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <SettingsField label="Store Name *">
                <Input
                  required
                  value={form.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                  placeholder="e.g. Apex Gadgets"
                  className="h-10 rounded-lg bg-background"
                />
              </SettingsField>

              <SettingsField label="Store Description">
                <textarea
                  value={form.storeDescription}
                  onChange={(e) => set("storeDescription", e.target.value)}
                  rows={4}
                  placeholder="Briefly describe your store and offerings..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
                />
              </SettingsField>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-border/70 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Phone className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Contact & Support
                </p>
                <p className="text-xs text-muted-foreground">
                  Where customers and platform admins reach you
                </p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="Contact Email *">
                  <Input
                    type="email"
                    required
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="support@store.com"
                    className="h-10 rounded-lg bg-background"
                  />
                </SettingsField>
                <SettingsField label="Contact Phone">
                  <Input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 rounded-lg bg-background"
                  />
                </SettingsField>
              </div>

              <SettingsField label="Business Address">
                <textarea
                  value={form.businessAddress}
                  onChange={(e) => set("businessAddress", e.target.value)}
                  rows={2}
                  placeholder="Registered address..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
                />
              </SettingsField>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs md:col-span-2">
          <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Business Verification
                </p>
                <p className="text-xs text-muted-foreground">
                  Government tax & compliance records
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="size-3" /> Verified
            </span>
          </div>
          <div className="p-6">
            <SettingsField label="Tax ID / GSTIN">
              <Input
                value={profile?.taxId || "—"}
                disabled
                className="h-10 rounded-lg opacity-65 cursor-not-allowed bg-muted font-mono"
              />
            </SettingsField>
            <p className="text-[11px] text-muted-foreground mt-2">
              Tax details are locked after merchant onboarding. Contact platform
              support to request modifications.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          {hasChanges
            ? "You have unsaved changes."
            : "All store information is up to date."}
        </p>
        <Button
          type="submit"
          disabled={isPending || !hasChanges}
          className="w-full sm:w-auto h-10 px-8 rounded-lg font-medium cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving changes…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

function SettingsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-foreground block">{label}</span>
      {children}
    </label>
  );
}
