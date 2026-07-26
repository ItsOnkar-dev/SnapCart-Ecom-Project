// Manages order tracking, quick logical actions, cancellation prompts, and order receipt modals.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrders, useUpdateAdminOrderStatus } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order.types";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";
import { useState } from "react";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function OrdersTab() {
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders(
    orderPage,
    true,
  );
  const { mutate: updateOrderStatus, isPending: isUpdatingOrderStatus } =
    useUpdateAdminOrderStatus();

  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelOrderConfirmId, setCancelOrderConfirmId] = useState<
    string | null
  >(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const handleConfirmCancelOrder = () => {
    if (cancelOrderConfirmId) {
      updateOrderStatus(
        { id: cancelOrderConfirmId, status: "cancelled" },
        { onSuccess: () => setCancelOrderConfirmId(null) },
      );
    }
  };

  const getNextStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Confirm Order",
          next: "confirmed" as OrderStatus,
          color: "bg-blue-600 hover:bg-blue-500 text-white",
        };
      case "confirmed":
        return {
          label: "Ship Order",
          next: "shipped" as OrderStatus,
          color: "bg-indigo-600 hover:bg-indigo-500 text-white",
        };
      case "shipped":
        return {
          label: "Deliver Order",
          next: "delivered" as OrderStatus,
          color: "bg-emerald-600 hover:bg-emerald-500 text-white",
        };
      default:
        return null;
    }
  };

  const filteredOrders =
    ordersData?.orders?.filter((order: Order) => {
      if (orderStatusFilter === "all") return true;
      return order.status === orderStatusFilter;
    }) ?? [];

  if (ordersLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-card border border-border space-y-2 rounded-xl"
          >
            <Skeleton className="h-5 w-1/3 bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Order Tracking & Fulfillment
        </h2>
        <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium w-fit">
          {[
            "all",
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setOrderStatusFilter(status)}
              className={cn(
                "px-2.5 py-1 capitalize rounded cursor-pointer transition-colors",
                orderStatusFilter === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {!filteredOrders.length ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">
            No orders match this status filter.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredOrders.map(
              (order: Order & { user?: { name: string; email: string } }) => {
                const nextStep = getNextStatusConfig(order.status);
                return (
                  <div
                    key={order._id}
                    className={cn(
                      "group p-5 bg-card border border-border hover:border-border/80 rounded-xl transition-all duration-200 relative overflow-hidden",
                      order.status === "cancelled" &&
                        "bg-muted/10 border-border/40 opacity-75",
                      order.status === "delivered" &&
                        "border-emerald-500/10 hover:border-emerald-500/20",
                    )}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">
                              {(order.user?.name ?? "?")[0]}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground leading-none">
                                {order.user?.name ?? "Unknown User"}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize text-[10px] font-semibold py-0 px-1.5 h-4 border",
                                  order.status === "pending" &&
                                    "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                  order.status === "confirmed" &&
                                    "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                  order.status === "shipped" &&
                                    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                                  order.status === "delivered" &&
                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                  order.status === "cancelled" &&
                                    "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                )}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                              {order.user?.email ?? ""} &middot;{" "}
                              <span className="font-mono">
                                #{order._id.slice(-6)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center sm:items-end flex-row sm:flex-col justify-between sm:justify-start gap-1">
                          <span className="text-lg font-bold text-foreground font-sans">
                            {formatPrice(order.totalPrice ?? 0)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-mono py-0 h-4 bg-muted/40"
                            >
                              {order.paymentMethod}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] capitalize py-0 h-4 font-normal",
                                order.paymentStatus === "paid"
                                  ? "text-emerald-400 border-emerald-500/20"
                                  : "text-amber-400 border-amber-500/20",
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
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Thumbnails */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 bg-muted/20 border border-border/40 px-2.5 py-1.5 rounded-lg min-w-0"
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
                                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-dashed border-border text-xs font-semibold text-muted-foreground shrink-0">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          {nextStep && (
                            <Button
                              size="sm"
                              disabled={isUpdatingOrderStatus}
                              onClick={() =>
                                updateOrderStatus({
                                  id: order._id,
                                  status: nextStep.next,
                                })
                              }
                              className={cn(
                                "text-xs font-medium h-8 cursor-pointer transition-colors shadow-sm",
                                nextStep.color,
                              )}
                            >
                              <PackageCheck className="h-4 w-4 mr-1.5" />{" "}
                              {nextStep.label}
                            </Button>
                          )}

                          {order.status !== "cancelled" &&
                            order.status !== "delivered" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingOrderStatus}
                                onClick={() =>
                                  setCancelOrderConfirmId(order._id)
                                }
                                className="text-xs h-8 cursor-pointer border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20"
                                title="Cancel/Delete Order"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDetailOpen(true);
                            }}
                            className="text-xs h-8 cursor-pointer border-border hover:bg-muted"
                          >
                            <Eye className="h-4 w-4 mr-1.5" /> View Details
                          </Button>
                        </div>
                      </div>

                      {/* Info Footer */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 font-mono mt-1">
                        <p className="flex items-center gap-1.5 font-sans">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state}
                        </p>
                        <p>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* Pagination */}
          {ordersData.pagination && ordersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
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
                type="button"
                disabled={!ordersData.pagination.hasNextPage}
                onClick={() => setOrderPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-medium border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Cancel Order AlertDialog Confirmation */}
      <AlertDialog
        open={!!cancelOrderConfirmId}
        onOpenChange={() => setCancelOrderConfirmId(null)}
      >
        <AlertDialogContent className="bg-card border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to cancel this order?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This acts as a logical deletion. It flags the order as cancelled,
              voids payment requirements, and atomically restores reserved
              product stock quantities to the storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelOrder}
              disabled={isUpdatingOrderStatus}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isUpdatingOrderStatus ? "Processing..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Details Modal Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Order Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-mono">
                  ID: #{selectedOrder?._id}
                </DialogDescription>
              </div>
              {selectedOrder && (
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Order Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    disabled={isUpdatingOrderStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as OrderStatus;
                      updateOrderStatus({
                        id: selectedOrder._id,
                        status: newStatus,
                      });
                      setSelectedOrder((prev) =>
                        prev ? { ...prev, status: newStatus } : null,
                      );
                    }}
                    className="text-xs bg-muted hover:bg-muted/80 border border-border rounded px-2.5 py-1 font-semibold text-foreground capitalize focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 pt-3">
              <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Shipping Address
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-foreground">
                    {selectedOrder.shippingAddress.fullName}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono">
                    Phone: {selectedOrder.shippingAddress.phone}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedOrder.shippingAddress.street}, <br />
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state} -{" "}
                    <span className="font-mono">
                      {selectedOrder.shippingAddress.pincode}
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">
                      Method
                    </span>
                    <Badge
                      variant="outline"
                      className="uppercase font-mono text-[10px]"
                    >
                      {selectedOrder.paymentMethod}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-0.5">
                      Status
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-[10px] font-medium",
                        selectedOrder.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      )}
                    >
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  Ordered Items ({selectedOrder.items.length})
                </h4>
                <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 p-2 bg-muted/20 border border-border/40 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover shrink-0 rounded"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/60" />
              <div className="space-y-1.5 text-sm pt-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {selectedOrder.shipping === 0
                      ? "Free"
                      : formatPrice(selectedOrder.shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base text-foreground pt-1.5 border-t border-border/40">
                  <span>Total Price</span>
                  <span>{formatPrice(selectedOrder.totalPrice)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
