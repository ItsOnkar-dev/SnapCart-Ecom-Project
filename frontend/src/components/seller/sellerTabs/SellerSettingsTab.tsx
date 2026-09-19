import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSellerProfile,
  useUpdateSellerProfile,
} from "@/hooks/useSellerProducts";
import { Loader2 } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full bg-muted/60 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Store profile</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visible to buyers on your store page
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <SettingsField label="Store name *">
            <Input
              value={form.storeName}
              onChange={(e) => set("storeName", e.target.value)}
              className="h-10 rounded-none"
            />
          </SettingsField>
          <SettingsField label="Store description">
            <textarea
              value={form.storeDescription}
              onChange={(e) => set("storeDescription", e.target.value)}
              rows={3}
              className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </SettingsField>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">
            Contact details
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used for order notifications and support
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <SettingsField label="Contact email *">
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className="h-10 rounded-none"
            />
          </SettingsField>
          <SettingsField label="Contact phone">
            <Input
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              placeholder="+91 98765 43210"
              className="h-10 rounded-none"
            />
          </SettingsField>
          <SettingsField label="Business address">
            <textarea
              value={form.businessAddress}
              onChange={(e) => set("businessAddress", e.target.value)}
              rows={3}
              className="w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </SettingsField>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">
            Business verification
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Locked after approval — contact support to update
          </p>
        </div>
        <div className="px-6 py-5">
          <SettingsField label="Tax ID / GSTIN">
            <Input
              value={profile?.taxId ?? "—"}
              disabled
              className="h-10 rounded-none opacity-50 cursor-not-allowed"
            />
          </SettingsField>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => update(form)}
          disabled={isPending}
          className="h-10 px-7 rounded-none bg-foreground text-background hover:bg-foreground/90"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </div>
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
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
