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
import { ChevronLeft, ChevronRight, CreditCard, MapPin } from "lucide-react";
import { useState } from "react";
import AdminOrderCard from "../AdminOrderCard";

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

  const filteredOrders =
    ordersData?.orders?.filter((order: Order) => {
      if (orderStatusFilter === "all") return true;
      return order.status === orderStatusFilter;
    }) ?? [];

  if (ordersLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 bg-card border border-border space-y-3 rounded-xl"
          >
            <Skeleton className="h-5 w-1/4 bg-muted/60" />
            <Skeleton className="h-4 w-1/2 bg-muted/40" />
            <Skeleton className="h-10 w-full bg-muted/20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section with mobile wrapping support */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Order Tracking & Fulfillment
        </h2>
        {/* Order quick state filters */}
        <div className="flex flex-wrap items-center gap-1 bg-muted/50 p-1.5 border border-border rounded-xl text-xs font-medium w-full sm:w-fit overflow-x-auto">
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
                "px-3 py-1.5 capitalize rounded-lg cursor-pointer transition-colors shrink-0",
                orderStatusFilter === status
                  ? "bg-background text-foreground shadow-sm font-semibold border border-border/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {!filteredOrders.length ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-2xl">
          <p className="text-sm text-muted-foreground">
            No orders match this status filter.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredOrders.map(
              (order: Order & { user?: { name: string; email: string } }) => (
                <AdminOrderCard
                  key={order._id}
                  order={order}
                  isUpdating={isUpdatingOrderStatus}
                  onUpdateStatus={(id, status) =>
                    updateOrderStatus({ id, status })
                  }
                  onCancel={(id) => setCancelOrderConfirmId(id)}
                  onViewDetails={(ord) => {
                    setSelectedOrder(ord);
                    setOrderDetailOpen(true);
                  }}
                />
              ),
            )}
          </div>

          {/* Pagination Controls */}
          {ordersData.pagination && ordersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/10">
              <button
                type="button"
                disabled={!ordersData.pagination.hasPrevPage}
                onClick={() => setOrderPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-semibold border border-border disabled:opacity-40 hover:bg-muted/30 rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs text-muted-foreground font-semibold">
                Page {ordersData.pagination.page} of{" "}
                {ordersData.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!ordersData.pagination.hasNextPage}
                onClick={() => setOrderPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-semibold border border-border disabled:opacity-40 hover:bg-muted/30 rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Cancel Order Dialog Modal */}
      <AlertDialog
        open={!!cancelOrderConfirmId}
        onOpenChange={() => setCancelOrderConfirmId(null)}
      >
        <AlertDialogContent className="rounded-2xl bg-card border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold tracking-tight">
              Are you sure you want to cancel this order?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              This triggers a database cancellation. It marks the order status
              as cancelled, releases all reserved stock items back to the store
              catalog atomically, and resolves outstanding payment claims.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80 rounded-lg h-9 text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelOrder}
              disabled={isUpdatingOrderStatus}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg h-9 text-xs font-semibold"
            >
              {isUpdatingOrderStatus ? "Processing..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Details Receipt Dialog Modal */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                  Order details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1.5 font-mono">
                  ID: #{selectedOrder?._id}
                </DialogDescription>
              </div>
              {selectedOrder && (
                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Fulfillment Status
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
                    className="text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg px-3 py-1.5 font-semibold text-foreground capitalize focus:outline-none cursor-pointer disabled:opacity-50"
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
            <div className="space-y-5 pt-4">
              {/* Shipping address info */}
              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Shipping Info
                </h4>
                <div className="text-sm space-y-1 font-sans">
                  <p className="font-semibold text-foreground text-sm">
                    {selectedOrder.shippingAddress.fullName}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono">
                    Phone: {selectedOrder.shippingAddress.phone}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-xs pt-0.5">
                    {selectedOrder.shippingAddress.street}, <br />
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state} -{" "}
                    <span className="font-mono">
                      {selectedOrder.shippingAddress.pincode}
                    </span>
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" /> Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider mb-1">
                      Method
                    </span>
                    <Badge
                      variant="outline"
                      className="uppercase font-mono text-[10px] font-bold rounded"
                    >
                      {selectedOrder.paymentMethod}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider mb-1">
                      Status
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-[10px] font-bold rounded",
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

              {/* Ordered Items Receipt */}
              <div className="space-y-3 font-sans">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ordered Items ({selectedOrder.items.length})
                </h4>
                <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 p-2.5 bg-muted/10 border border-border/40 rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover shrink-0 rounded-lg border border-border/30"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[200px]">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatPrice(item.price)} &middot; Qty{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold shrink-0 text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Math */}
              <div className="h-px bg-border/60" />
              <div className="space-y-1.5 text-sm pt-1 font-sans">
                <div className="flex justify-between text-muted-foreground">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="font-medium">Shipping Charge</span>
                  <span className="font-semibold text-foreground">
                    {selectedOrder.shipping === 0
                      ? "Free"
                      : formatPrice(selectedOrder.shipping)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base text-foreground pt-2.5 border-t border-border/40">
                  <span>Total</span>
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
