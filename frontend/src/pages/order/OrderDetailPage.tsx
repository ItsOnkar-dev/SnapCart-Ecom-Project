import { Check, ChevronLeft, PackageCheck } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrders";
import type { OrderItem, OrderStatus } from "@/types/order.types";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useOrder(id);

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

  const currentIndex =
    order.status === "cancelled" ? -1 : STATUS_STEPS.indexOf(order.status);

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
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Order #{order._id.slice(-8).toUpperCase()}
                </p>
                <h1 className="mt-1 text-3xl font-bold text-foreground">
                  Order details
                </h1>
              </div>
              <span className="w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold capitalize text-primary-glow">
                {order.status}
              </span>
            </div>

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
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
