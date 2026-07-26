import { PackageOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import type { Order } from "@/types/order.types";

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

const statusConfig: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  delivered: {
    label: "Delivered",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  shipped: {
    label: "Out for delivery",
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  confirmed: {
    label: "Confirmed · Preparing",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  pending: {
    label: "Pending",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
};

function OrderStatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function OrdersPage() {
  const [orderPage, setOrderPage] = useState(1);
  const { data, isLoading, error } = useOrders(orderPage);
  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-border/70 pb-6">
          <p className="mb-2 text-sm text-muted-foreground">Home / Orders</p>
          <h1 className="text-3xl font-bold text-foreground md:text-5xl">
            Orders
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-2xl border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-muted-foreground">
            Could not load your orders. Please try again.
          </p>
        ) : orders.length === 0 ? (
          <section className="grid min-h-[380px] place-items-center rounded-2xl border border-border bg-card px-6 text-center">
            <div>
              <PackageOpen className="mx-auto mb-5 size-12 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                No orders yet
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your completed Snapcart orders will appear here.
              </p>
              <Button asChild className="mt-6">
                <Link to="/products">Shop products</Link>
              </Button>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <div
                key={order._id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {/* Header bar */}
                <div className="grid grid-cols-2 gap-4 border-b border-border bg-muted/40 px-5 py-3 sm:grid-cols-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Order placed
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Total
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatPrice(order.totalPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {order.paymentMethod === "cod"
                        ? "Cash on delivery"
                        : "Razorpay"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Ship to
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {order.shippingAddress.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Order #
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Item rows */}
                <div className="divide-y divide-border px-5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 py-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-[72px] w-[72px] shrink-0 rounded-lg border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-snug mb-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Qty: {item.quantity}
                        </p>
                        <OrderStatusPill status={order.status} />
                      </div>
                      <span className="shrink-0 text-sm font-medium text-foreground pt-0.5">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-3">
                  <span className="text-xs text-muted-foreground">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </span>
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            ))}

            {/* ── Pagination ── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setOrderPage((p) => p - 1)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  ← Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setOrderPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
