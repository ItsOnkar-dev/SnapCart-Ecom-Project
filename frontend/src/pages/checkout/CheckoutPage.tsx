import { ArrowRight, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { applyCouponApi } from "@/api/coupon.api";
import CheckoutHeader from "@/components/layout/CheckoutHeader";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, useRemoveCartItem } from "@/hooks/useCart";
import { usePlaceOrder } from "@/hooks/useOrders";
import { usePayment } from "@/hooks/usePayment";
import { getApiErrorMessage } from "@/types/api.types";
import type { CartItem } from "@/types/cart.types";
import type { ShippingAddress } from "@/types/order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const emptyAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

const getItemPrice = (item: CartItem) => {
  if (!item.product) return 0;

  return item.product.discountPrice &&
    item.product.discountPrice < item.product.price
    ? item.product.discountPrice
    : item.product.price;
};

type ShippingOption = "standard" | "express" | "overnight";

const SHIPPING_OPTIONS: {
  key: ShippingOption;
  label: string;
  duration: string;
  cost: number;
}[] = [
  { key: "standard", label: "Standard", duration: "3–5 days", cost: 0 },
  { key: "express", label: "Express", duration: "1–2 days", cost: 15 },
  { key: "overnight", label: "Overnight", duration: "Tomorrow", cost: 35 },
];

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { data: cart, isLoading } = useCart();
  const { mutate: removeCartItem, isPending: isRemoving } = useRemoveCartItem();
  const { initiatePayment, isPending: isRazorpayPending } = usePayment();
  const { mutate: placeOrder, isPending: isCodPending } = usePlaceOrder();
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    "online",
  );
  const [shippingOption, setShippingOption] =
    useState<ShippingOption>("standard");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    discount: number;
    finalTotal: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const items = useMemo(() => {
    return (cart?.items ?? []).filter(
      (item: CartItem) => item.product !== null && item.product !== undefined,
    );
  }, [cart?.items]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum: number, item: CartItem) =>
          sum + getItemPrice(item) * item.quantity,
        0,
      ),
    [items],
  );

  const shipping =
    shippingOption === "standard" ? 0 : shippingOption === "express" ? 15 : 35;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total = subtotal + shipping - couponDiscount;

  const hasInvalidStock = items.some(
    (item: CartItem) => item.quantity > item.product.stock,
  );

  const canCheckout =
    items.length > 0 &&
    !hasInvalidStock &&
    Object.values(address).every((v) => v.trim().length > 0);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) =>
    setAddress((curr) => ({ ...curr, [field]: value }));

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await applyCouponApi(couponCode.trim(), subtotal);
      setAppliedCoupon(res.data.data);
    } catch (error: unknown) {
      setAppliedCoupon(null);
      setCouponError(getApiErrorMessage(error, "Could not apply coupon."));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCheckout) return;
    if (paymentMethod === "cod") {
      placeOrder({ shippingAddress: address, couponCode: appliedCoupon?.code });
    } else {
      initiatePayment({
        shippingAddress: address,
        couponCode: appliedCoupon?.code,
      });
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <CheckoutHeader />
        <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-10 md:px-6">
          <div className="h-8 w-48 rounded bg-muted/30" />
          <div className="grid gap-8 lg:grid-cols-[1fr_460px]">
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl border border-border bg-card/50"
                />
              ))}
            </div>
            <div className="h-96 rounded-2xl border border-border bg-card/50" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background px-4 py-20 md:px-6">
        <CheckoutHeader />
        <div className="mx-auto max-w-sm text-center">
          <ShoppingBag className="mx-auto mb-5 size-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add some products and come back to checkout.
          </p>
          <Button asChild className="mt-6">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Main layout: Order Summary first on mobile, Customer Info first on desktop ──

  return (
    <main className="min-h-screen bg-background">
      <CheckoutHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {/* Page header */}
        <div className="mb-8 border-b border-border/70 pb-6">
          <p className="text-sm text-muted-foreground">Home / Checkout</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Mobile: Order Summary first ──────────────────────────────────── */}
          <div className="grid gap-8 lg:grid-cols-[1fr_460px]">
            {/* ── Left: Customer Information ──────────────────────────────── */}
            <section className="order-2 lg:order-1">
              <div className="rounded-none border border-border bg-muted/20 p-6 md:p-8">
                <h2 className="mb-6 text-xl font-bold text-foreground">
                  Customer Information
                </h2>
                {/* Address fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <Input
                      placeholder="John Doe"
                      value={address.fullName}
                      onChange={(e) =>
                        handleAddressChange("fullName", e.target.value)
                      }
                      className="rounded-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={address.phone}
                      onChange={(e) =>
                        handleAddressChange("phone", e.target.value)
                      }
                      className="rounded-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Street address
                    </label>
                    <Input
                      placeholder="123 Main St, Apartment 4B"
                      value={address.street}
                      onChange={(e) =>
                        handleAddressChange("street", e.target.value)
                      }
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      City
                    </label>
                    <Input
                      placeholder="Mumbai"
                      value={address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      className="rounded-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      State
                    </label>
                    <Input
                      placeholder="Maharashtra"
                      value={address.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      className="rounded-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Pincode
                    </label>
                    <Input
                      placeholder="400001"
                      value={address.pincode}
                      onChange={(e) =>
                        handleAddressChange("pincode", e.target.value)
                      }
                      className="rounded-none"
                    />
                  </div>
                </div>{" "}
                {/* ── end address fields grid ── */}
                {/* ── Shipping Method ──────────────────────────────────────────── */}
                <div className="mt-8 border-t border-border pt-8">
                  <h3 className="mb-4 text-lg font-bold text-foreground">
                    Shipping Method
                  </h3>
                  <div className="space-y-3">
                    {SHIPPING_OPTIONS.map((opt) => {
                      const isSelected = shippingOption === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setShippingOption(opt.key)}
                          className={`flex w-full items-center gap-4 border px-4 py-3.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-muted-foreground/30"
                          }`}
                        >
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && (
                              <span className="size-2 rounded-full bg-white" />
                            )}
                          </span>
                          <div className="flex flex-1 items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {opt.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {opt.duration}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {opt.cost === 0 ? "Free" : formatPrice(opt.cost)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* ── Payment method ────────────────────────────────────────── */}
                <div className="mt-8 border-t border-border pt-8">
                  <h3 className="mb-4 text-lg font-bold text-foreground">
                    Payment method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("online")}
                      className={`flex items-center gap-3 border-2 px-4 py-3 text-left text-sm transition-all cursor-pointer ${
                        paymentMethod === "online"
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                          paymentMethod === "online"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "online" && (
                          <span className="size-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="font-medium">Pay Online</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center gap-3 border-2 px-4 py-3 text-left text-sm transition-all cursor-pointer ${
                        paymentMethod === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                          paymentMethod === "cod"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "cod" && (
                          <span className="size-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span className="font-medium">Cash on Delivery</span>
                    </button>
                  </div>
                </div>
                {/* ── Submit ────────────────────────────────────────────────── */}
                <Button
                  type="submit"
                  size="lg"
                  className="mt-8 h-12 w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
                  disabled={!canCheckout || isRazorpayPending || isCodPending}
                >
                  {isRazorpayPending || isCodPending
                    ? "Processing..."
                    : paymentMethod === "cod"
                      ? "Place Order"
                      : "Pay Now"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Lock className="size-3" />
                  Secure checkout — your information is encrypted
                </p>
              </div>
            </section>

            {/* ── Right: Order Summary ─────────────────────────────────────── */}
            <aside className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-none border border-border bg-muted/20 p-6 md:p-8">
                <h2 className="mb-6 text-xl font-bold text-foreground">
                  Order Summary
                </h2>

                {/* Cart items */}
                <div className="space-y-4">
                  {items.map((item: CartItem) => {
                    const image = item.product.images?.[0];
                    const itemPrice = getItemPrice(item);
                    const outOfStock = item.quantity > item.product.stock;

                    return (
                      <div key={item._id} className="flex gap-3">
                        {/* Image */}
                        <Link
                          to={`/products/${item.product._id}`}
                          className="aspect-square size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </Link>

                        {/* Details */}
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/products/${item.product._id}`}
                              className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {item.product.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                            {outOfStock && (
                              <p className="mt-0.5 text-xs text-destructive">
                                Reduce to {item.product.stock}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                              {formatPrice(itemPrice * item.quantity)}
                            </span>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              disabled={isRemoving}
                              onClick={() => removeCartItem(item.product._id)}
                              aria-label="Remove item"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon code */}
                <div className="mt-6 border-t border-sidebar-border pt-6">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Coupon code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError("");
                      }}
                      className="flex-1 rounded-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={handleApplyCoupon}
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                  {couponError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {couponError}
                    </p>
                  ) : null}
                  {appliedCoupon ? (
                    <div className="mt-3 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>
                          Coupon <strong>{appliedCoupon.code}</strong> applied —
                          saved {formatPrice(appliedCoupon.discount)}.
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-success underline-offset-4 transition hover:text-success/80"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-3 border-t border-sidebar-border pt-6 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-foreground">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  {couponDiscount > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Coupon discount</span>
                      <span className="text-foreground">
                        -{formatPrice(couponDiscount)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-sidebar-border pt-3 text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
      <Footer />
    </main>
  );
}
