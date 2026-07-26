import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order.types";
import {
  Ban,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  Calendar,
  Eye,
} from "lucide-react";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

interface AdminOrderCardProps {
  order: Order & { user?: { name: string; email: string } };
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onCancel: (id: string) => void;
  onViewDetails: (order: Order) => void;
}

export default function AdminOrderCard({
  order,
  isUpdating,
  onUpdateStatus,
  onCancel,
  onViewDetails,
}: AdminOrderCardProps) {
  
  const getNextStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Confirm Order",
          next: "confirmed" as OrderStatus,
          color: "bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-700 dark:hover:bg-blue-600",
        };
      case "confirmed":
        return {
          label: "Ship Order",
          next: "shipped" as OrderStatus,
          color: "bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-700 dark:hover:bg-indigo-600",
        };
      case "shipped":
        return {
          label: "Deliver Order",
          next: "delivered" as OrderStatus,
          color: "bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600",
        };
      default:
        return null;
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const config = {
      pending: { icon: Clock, style: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      confirmed: { icon: CheckCircle2, style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      shipped: { icon: Truck, style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
      delivered: { icon: PackageCheck, style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      cancelled: { icon: Ban, style: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    }[status];

    const Icon = config?.icon || Clock;

    return (
      <Badge
        variant="outline"
        className={cn(
          "capitalize text-[10px] font-semibold py-0.5 px-2 h-5 border flex items-center gap-1 w-fit rounded-full",
          config?.style,
        )}
      >
        <Icon className="h-3 w-3 shrink-0" />
        {status}
      </Badge>
    );
  };

  const nextStep = getNextStatusConfig(order.status);

  return (
    <div
      className={cn(
        "group p-5 sm:p-6 bg-card border border-border hover:border-border/80 rounded-2xl transition-all duration-200 relative overflow-hidden",
        order.status === "cancelled" && "bg-muted/10 border-border/40 opacity-75",
        order.status === "delivered" && "border-emerald-500/10 hover:border-emerald-500/20",
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {(order.user?.name ?? "?")[0]}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground leading-none">
                  {order.user?.name ?? "Unknown User"}
                </p>
                {renderStatusBadge(order.status)}
              </div>
              <p className="text-xs text-muted-foreground leading-tight mt-1.5">
                {order.user?.email ?? ""} &middot;{" "}
                <span className="font-mono bg-muted/40 px-1 py-0.5 rounded text-[10px]">
                  #{order._id.slice(-6)}
                </span>
              </p>
            </div>
          </div>

          {/* Price Details Block */}
          <div className="flex items-center md:items-end flex-row md:flex-col justify-between md:justify-start gap-1.5">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(order.totalPrice ?? 0)}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-mono py-0 h-4.5 bg-muted/40 rounded"
              >
                {order.paymentMethod}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] capitalize py-0 h-4.5 font-medium rounded",
                  order.paymentStatus === "paid"
                    ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                    : "bg-amber-500/5 text-amber-400 border-amber-500/10",
                )}
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Items and Actions Row */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Thumbnails */}
          <div className="flex items-center gap-2 flex-wrap">
            {order.items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 bg-muted/20 border border-border/40 px-3 py-1.5 rounded-xl min-w-0"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-8 h-8 object-cover shrink-0 rounded-md border border-border/30"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate max-w-[120px] leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-1">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted border border-dashed border-border text-xs font-semibold text-muted-foreground shrink-0">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          {/* Interactive Actions */}
          <div className="flex items-center gap-2 w-full xl:w-auto justify-end mt-2 xl:mt-0">
            {nextStep && (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(order._id, nextStep.next)}
                className={cn(
                  "text-xs font-semibold h-8.5 rounded-lg cursor-pointer transition-colors shadow-sm flex-1 sm:flex-initial px-3.5",
                  nextStep.color,
                )}
              >
                <PackageCheck className="h-4 w-4 mr-1.5" />{" "}
                {nextStep.label}
              </Button>
            )}

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={() => onCancel(order._id)}
                className="text-xs h-8.5 w-9 shrink-0 rounded-lg cursor-pointer border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20"
                title="Cancel Order"
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(order)}
              className="text-xs h-8.5 rounded-lg cursor-pointer border-border hover:bg-muted font-medium flex-1 sm:flex-initial px-3.5"
            >
              <Eye className="h-4 w-4 mr-1.5" /> Details
            </Button>
          </div>
        </div>

        {/* Info Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-muted-foreground/70 font-mono mt-1 pt-1.5 border-t border-border/10">
          <p className="flex items-center gap-1.5 font-sans font-medium text-muted-foreground">
            <Truck className="h-3.5 w-3.5 text-muted-foreground/60" />
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground/60" />
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}