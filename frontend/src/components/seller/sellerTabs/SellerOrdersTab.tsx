import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useSellerOrders } from "@/hooks/useSellerProducts";
import type { Order } from "@/types/order.types";
import { Box, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function SellerOrdersTab() {
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    string | undefined
  >(undefined);
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useSellerOrders(
    orderStatusFilter,
    orderPage,
  );
  const { mutate: updateOrderStatus } = useUpdateOrderStatus();

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => {
            setOrderStatusFilter(undefined);
            setOrderPage(1);
          }}
          className={cn(
            "px-3 py-1 text-xs font-medium border border-border rounded-md transition-colors cursor-pointer",
            !orderStatusFilter
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setOrderStatusFilter(s);
              setOrderPage(1);
            }}
            className={cn(
              "px-3 py-1 text-xs font-medium border border-border rounded-md capitalize transition-colors cursor-pointer",
              orderStatusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {ordersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-muted/60 rounded-xl" />
          ))}
        </div>
      ) : !ordersData?.orders?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Box className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p className="text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordersData.orders.map(
            (order: Order & { user?: { name: string; email: string } }) => (
              <div
                key={order._id}
                className="p-4 bg-card rounded-xl border border-border/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {order.user?.name ?? "Unknown"}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item(s) ·{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {formatPrice(order.totalPrice ?? 0)}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus({
                          orderId: order._id,
                          status: e.target
                            .value as (typeof STATUS_OPTIONS)[number],
                        })
                      }
                      className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ),
          )}

          {ordersData.pagination && ordersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={!ordersData.pagination.hasPrevPage}
                onClick={() => setOrderPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-medium border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Page {ordersData.pagination.page} of{" "}
                {ordersData.pagination.totalPages}
              </span>
              <button
                disabled={!ordersData.pagination.hasNextPage}
                onClick={() => setOrderPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
