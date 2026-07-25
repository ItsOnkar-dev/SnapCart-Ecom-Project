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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrders, useAdminProductsCount, useAdminSellers, useUpdateSellerStatus } from "@/hooks/useAdmin";
import type { SellerApplicant } from "@/types/seller.types";
import { Check, ChevronLeft, ChevronRight, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { Order } from "@/types/order.types";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

type ActiveTab = "analytics" | "products" | "orders" | "sellers";

export default function AdminSellersPage() {
  const navigate = useNavigate();
  const { data: applicants, isLoading: sellersLoading, isError: sellersError } = useAdminSellers();
  const { data: productsCount } = useAdminProductsCount();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateSellerStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerApplicant | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"approved" | "rejected" | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sellers");
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders(activeTab === "orders" ? orderPage : 1);

  const tabs: { key: ActiveTab; label: string; count: number | null }[] = [
    { key: "analytics", label: "Analytics", count: null },
    { key: "products", label: "Products", count: productsCount ?? 0 },
    { key: "orders", label: "Orders", count: ordersData?.pagination?.total ?? 0 },
    { key: "sellers", label: "Sellers", count: applicants?.length ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <Link to="/account" className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
            Back to account
          </Link>
        </div>

        {/* Nav Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-1.5 border border-border mb-8 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "analytics") navigate("/admin/analytics");
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 ${
                  activeTab === tab.key ? "bg-muted text-foreground" : "bg-muted/60 text-muted-foreground"
                }`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products Section */}
        {activeTab === "products" && (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 border border-dashed border-border text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Product Management</h2>
            <p className="text-sm text-muted-foreground mb-1">{productsCount ?? 0} active products</p>
            <p className="text-xs text-muted-foreground">Product management UI coming soon.</p>
          </div>
        )}

        {/* Orders Section */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">All Orders</h2>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-card border border-border space-y-2">
                    <Skeleton className="h-5 w-1/3 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </div>
                ))}
              </div>
            ) : !ordersData?.orders?.length ? (
              <div className="text-center py-12 bg-muted/20 border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {ordersData.orders.map((order: Order & { user?: { name: string; email: string } }) => (
                    <div key={order._id} className="p-4 bg-card border border-border hover:border-border/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {order.user?.name ?? "Unknown"} — {order.user?.email ?? ""}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length ?? 0} item(s) · {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                          {formatPrice(order.totalPrice ?? 0)}
                        </span>
                      </div>
                    </div>
                  ))}
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
                      Page {ordersData.pagination.page} of {ordersData.pagination.totalPages}
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
          </div>
        )}

        {/* Sellers Section */}
        {activeTab === "sellers" && (
          <div className="space-y-4">
            {sellersLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-6 bg-card border border-border space-y-3">
                    <Skeleton className="h-6 w-1/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </div>
                ))}
              </div>
            ) : sellersError ? (
              <div className="flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/40 text-center">
                <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-sm font-medium text-red-400">Failed to load seller applications.</p>
              </div>
            ) : !applicants || applicants.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 border border-dashed border-border">
                <p className="text-muted-foreground text-sm">No seller applications require review right now.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applicants.map((applicant: SellerApplicant) => (
                  <div key={applicant._id} className="group relative p-6 bg-card border border-border hover:border-border/80 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-foreground tracking-tight">{applicant.name}</h3>
                          <Badge variant={applicant.sellerStatus === "approved" ? "default" : "outline"} className={`capitalize text-xs px-2.5 py-0.5 font-medium ${
                            applicant.sellerStatus === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : applicant.sellerStatus === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {applicant.sellerStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {applicant.email} <span className="text-muted-foreground/50 font-sans mx-1.5">·</span> {applicant.phone || "No phone provided"}
                        </p>
                        <div className="pt-2 grid gap-1 text-xs text-muted-foreground">
                          <p><span className="text-muted-foreground font-medium">Business ID:</span> {applicant.businessId || "N/A"}</p>
                          <p className="leading-relaxed"><span className="text-muted-foreground font-medium">Address:</span> {applicant.address || "N/A"}</p>
                        </div>
                      </div>
                      {applicant.sellerStatus === "pending" && (
                        <div className="flex items-center gap-2 self-end md:self-start pt-2 md:pt-0">
                          <Button size="sm" disabled={isUpdating} onClick={() => { setSelectedSeller(applicant); setSelectedStatus("approved"); setDialogOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white gap-1.5 shadow-md shadow-emerald-950/20 transition-all">
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => { setSelectedSeller(applicant); setSelectedStatus("rejected"); setDialogOpen(true); }}
                            className="border-border cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 gap-1.5 transition-all">
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedStatus === "approved" ? "Approve seller application?" : "Reject seller application?"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <strong>{selectedStatus}</strong> <strong>{selectedSeller?.name}</strong>'s seller application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={selectedStatus === "approved" ? "default" : "destructive"} disabled={isUpdating}
              onClick={() => {
                if (!selectedSeller || !selectedStatus) return;
                updateStatus({ id: selectedSeller._id, status: selectedStatus });
                setDialogOpen(false);
                setSelectedSeller(null);
                setSelectedStatus(null);
              }}>
              {isUpdating ? (selectedStatus === "approved" ? "Approving..." : "Rejecting...") : selectedStatus === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
