import {
  AlertTriangle,
  Check,
  ChevronLeft,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useCancelOrder, useOrder } from "@/hooks/useOrders";
import type { OrderItem, OrderStatus } from "@/types/order.types";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
];

/** Statuses where the customer is still allowed to cancel */
const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "confirmed"];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

// ─── CancelOrderDialog ────────────────────────────────────────────────────────

function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md rounded-2xl border border-border bg-popover p-8"
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-rose-500/10">
              <AlertTriangle className="size-7 text-rose-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Cancel this order?
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="mt-1 text-center text-sm text-muted-foreground">
          This cannot be undone. Stock will be restored immediately. If you paid
          online, a refund will be initiated — it may take a few business days.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            id="confirm-cancel-order"
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl font-semibold"
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 size-4" />
                Cancelling…
              </>
            ) : (
              "Yes, cancel order"
            )}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl"
          >
            Keep order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── OrderDetailPage ──────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useOrder(id);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="text-center">
          <PackageCheck className="mx-auto mb-5 size-12 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            Order not found
          </h1>
          <Button asChild className="mt-6">
            <Link to="/orders">Back to orders</Link>
          </Button>
        </div>
      </main>
    );
  }

  const isCancelled = order.status === "cancelled";
  const canCancel = CANCELLABLE_STATUSES.includes(order.status as OrderStatus);
  const currentIndex = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status as OrderStatus);

  const handleConfirmCancel = () => {
    cancelOrder(order._id, {
      onSuccess: () => setCancelDialogOpen(false),
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/orders">
            <ChevronLeft className="size-4" />
            Back to orders
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Main section ── */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order #{order._id.slice(-8).toUpperCase()}
                </p>
                <h1 className="mt-1 text-3xl font-bold text-foreground">
                  Order details
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    isCancelled
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-primary/15 text-primary-glow"
                  }`}
                >
                  {order.status}
                </span>
                {/* ── Cancel button — visible only for pending/confirmed ── */}
                {canCancel && (
                  <button
                    id="cancel-order-btn"
                    type="button"
                    onClick={() => setCancelDialogOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <XCircle className="size-3.5" />
                    Cancel order
                  </button>
                )}
              </div>
            </div>

            {/* ── Status tracker ── */}
            {!isCancelled ? (
              <div className="mb-8 grid gap-3 sm:grid-cols-4">
                {STATUS_STEPS.map((status, index) => {
                  const isDone = currentIndex >= index;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span
                        className={`grid size-9 place-items-center rounded-full border ${isDone ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
                      >
                        <Check className="size-4" />
                      </span>
                      <span className="text-sm font-medium capitalize text-foreground">
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              // ── Cancelled banner ──
              <div className="mb-8 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <XCircle className="size-5 shrink-0 text-rose-500" />
                <p className="text-sm font-medium text-rose-500">
                  This order was cancelled. Stock has been restored.
                  {order.paymentStatus === "refund_pending" &&
                    " A refund has been initiated and will be processed shortly."}
                </p>
              </div>
            )}

            {/* ── Item list ── */}
            <div className="space-y-4">
              {order.items.map((item: OrderItem) => (
                <article
                  key={`${item.product}-${item.name}`}
                  className="grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-[88px_1fr_auto]"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-sidebar p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Shipping
              </h2>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-sidebar p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Summary
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal ?? order.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {(order.shipping ?? 0) === 0
                      ? "Free"
                      : formatPrice(order.shipping)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(order.totalPrice)}</span>
                </div>
              </div>

              {/* Payment + refund status */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span className="capitalize">
                  {order.paymentMethod === "cod"
                    ? "Cash on delivery"
                    : "Razorpay"}
                </span>
                <span
                  className={`font-medium capitalize ${
                    order.paymentStatus === "paid"
                      ? "text-emerald-500"
                      : order.paymentStatus === "refund_pending"
                        ? "text-amber-500"
                        : order.paymentStatus === "refunded"
                          ? "text-blue-500"
                          : "text-muted-foreground"
                  }`}
                >
                  {order.paymentStatus === "refund_pending"
                    ? "Refund pending"
                    : order.paymentStatus}
                </span>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* ── Cancel confirmation dialog ── */}
      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        isPending={isCancelling}
      />
    </main>
  );
}
