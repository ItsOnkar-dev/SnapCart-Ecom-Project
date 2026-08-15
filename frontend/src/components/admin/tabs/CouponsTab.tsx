import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "@/hooks/useCoupons";
import { useAuthStore } from "@/store/auth.store";
import type { Coupon, CouponDiscountType } from "@/types/coupon.types";

const initialFormState = {
  code: "",
  discountType: "percentage" as CouponDiscountType,
  discountValue: 0,
  minimumOrder: 0,
  maxDiscount: 0,
  usageLimit: 0,
  expiresAt: "",
  isActive: true,
};

export default function CouponsTab() {
  const { data: coupons, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const isDemoAdmin = useAuthStore(
    (state) => state.user?.role === "demo_admin",
  );

  const [formState, setFormState] = useState(initialFormState);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDemoAdmin) return;

    const payload = {
      code: formState.code.trim().toUpperCase(),
      discountType: formState.discountType,
      discountValue: Number(formState.discountValue),
      minimumOrder: Number(formState.minimumOrder),
      maxDiscount: Number(formState.maxDiscount),
      usageLimit: Number(formState.usageLimit),
      expiresAt: formState.expiresAt || undefined,
      isActive: formState.isActive,
    };

    if (editingCoupon) {
      updateCoupon.mutate({ id: editingCoupon._id, payload });
    } else {
      createCoupon.mutate(payload);
    }

    setEditingCoupon(null);
    setFormState(initialFormState);
  };

  const handleEdit = (coupon: Coupon) => {
    if (isDemoAdmin) return;

    setEditingCoupon(coupon);
    setFormState({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrder: coupon.minimumOrder,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      isActive: coupon.isActive,
    });
  };

  const handleCancel = () => {
    setEditingCoupon(null);
    setFormState(initialFormState);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Coupon Management</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Create, edit, and deactivate coupon codes for your promotions.
          </p>
          {isDemoAdmin ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Demo admin accounts are view-only for coupon management. Coupon
              actions are disabled.
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={() => setFormState(initialFormState)}
          disabled={isDemoAdmin}
        >
          <Plus className="mr-2 h-4 w-4" /> New coupon
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Coupon list</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : coupons?.length ? (
            <div className="space-y-3">
              {coupons.map((coupon: Coupon) => (
                <div
                  key={coupon._id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{coupon.code}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}% off`
                          : `₹${coupon.discountValue} off`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min order: ₹{coupon.minimumOrder} Max discount: ₹
                        {coupon.maxDiscount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Used {coupon.usedCount}/{coupon.usageLimit || "∞"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires:{" "}
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleEdit(coupon)}
                        disabled={isDemoAdmin}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteCoupon.mutate(coupon._id)}
                        disabled={isDemoAdmin}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
              No coupons found. Create a coupon to get started.
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold">
              {editingCoupon ? "Edit coupon" : "Create coupon"}
            </h3>
            {editingCoupon ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isDemoAdmin}
              >
                Cancel
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <Label htmlFor="code">Coupon code</Label>
              <Input
                id="code"
                value={formState.code}
                onChange={(e) =>
                  setFormState({ ...formState, code: e.target.value })
                }
                className="mt-2"
                placeholder="SUMMER10"
                required
                disabled={isDemoAdmin}
              />
            </div>

            <div>
              <Label htmlFor="discountType">Discount type</Label>
              <select
                id="discountType"
                value={formState.discountType}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    discountType: e.target.value as CouponDiscountType,
                  })
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
                disabled={isDemoAdmin}
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="discountValue">Discount value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  value={formState.discountValue}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      discountValue: Number(e.target.value),
                    })
                  }
                  className="mt-2"
                  required
                  disabled={isDemoAdmin}
                />
              </div>
              <div>
                <Label htmlFor="minimumOrder">Minimum order</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  min="0"
                  value={formState.minimumOrder}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      minimumOrder: Number(e.target.value),
                    })
                  }
                  className="mt-2"
                  disabled={isDemoAdmin}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxDiscount">Max discount</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  min="0"
                  value={formState.maxDiscount}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      maxDiscount: Number(e.target.value),
                    })
                  }
                  className="mt-2"
                  disabled={isDemoAdmin}
                />
              </div>
              <div>
                <Label htmlFor="usageLimit">Usage limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="0"
                  value={formState.usageLimit}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      usageLimit: Number(e.target.value),
                    })
                  }
                  className="mt-2"
                  disabled={isDemoAdmin}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiresAt">Expiration date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formState.expiresAt}
                onChange={(e) =>
                  setFormState({ ...formState, expiresAt: e.target.value })
                }
                className="mt-2"
                disabled={isDemoAdmin}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={formState.isActive}
                onCheckedChange={(checked: boolean) =>
                  setFormState({ ...formState, isActive: checked })
                }
                disabled={isDemoAdmin}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <Button type="submit" className="w-full" disabled={isDemoAdmin}>
              {editingCoupon ? "Update coupon" : "Create coupon"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
