import { ChevronRight, PackageOpen } from "lucide-react";
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
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="grid gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold capitalize text-primary-glow">
                      {order.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"} placed on{" "}
                    {formatDate(order.createdAt)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Delivering to {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-5 md:justify-end">
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(order.totalPrice)}
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </div>
              </Link>
            ))}

            {/* ── Pagination ── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setOrderPage((p) => p - 1)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed"
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
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed"
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
