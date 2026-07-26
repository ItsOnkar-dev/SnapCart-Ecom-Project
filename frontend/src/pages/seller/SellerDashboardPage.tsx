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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import {
  useCreateProduct,
  useDeleteProduct,
  useSellerOrders,
  useSellerProducts,
  useUpdateProduct,
} from "@/hooks/useSellerProducts";
import {
  PRODUCT_CATEGORY_OPTIONS,
  buildProductFormData,
  getProductFormState,
  initialProductFormState,
} from "@/lib/product-form";
import type { Order } from "@/types/order.types";
import type { Product } from "@/types/product.types";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useState } from "react";

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

type ActiveTab = "products" | "orders";

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [productPage, setProductPage] = useState(1);
  const { data: productsData, isLoading } = useSellerProducts(productPage);
  const products = productsData?.products ?? [];
  const productPagination = productsData?.pagination;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialProductFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "archived"
  >("all");
  const filteredProducts = products?.filter((p: Product) => {
    if (filterStatus === "active") return p.isActive === true;
    if (filterStatus === "archived") return p.isActive === false;
    return true;
  });

  // ── Orders tab state ───────────────────────────────────────────────────────
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    string | undefined
  >(undefined);
  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useSellerOrders(
    orderStatusFilter,
    orderPage,
  );
  const { mutate: updateOrderStatus } = useUpdateOrderStatus();

  const handleRestore = (product: Product) => {
    const fd = buildProductFormData(getProductFormState(product));
    fd.append("isActive", "true");
    updateMutation.mutate({ id: product._id, body: fd });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialProductFormState);
    setImageFile(null);
    setIsOpen(true);
  };
  const openEditModal = (product: Product) => {
    setEditingId(product._id);
    setFormData(getProductFormState(product));
    setImageFile(null);
    setIsOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = buildProductFormData(formData, imageFile);
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, body: fd },
        { onSuccess: () => setIsOpen(false) },
      );
    } else {
      createMutation.mutate(fd, { onSuccess: () => setIsOpen(false) });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Seller Dashboard
            </h1>
            <div className="flex gap-6 mt-6 border-b border-border">
              <button
                onClick={() => setActiveTab("products")}
                className={cn(
                  "pb-2 text-sm font-medium capitalize transition-colors cursor-pointer",
                  activeTab === "products"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "pb-2 text-sm font-medium capitalize transition-colors cursor-pointer",
                  activeTab === "orders"
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Orders
              </button>
            </div>
          </div>
          {activeTab === "products" && (
            <Button
              onClick={openCreateModal}
              className="bg-primary text-primary-foreground hover:bg-primary-hover font-medium rounded-lg flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New product
            </Button>
          )}
        </div>

        {/* ── Products Tab ──────────────────────────────────────────────────── */}
        {activeTab === "products" && (
          <>
            <div className="flex gap-6 mb-6">
              {(["all", "active", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={cn(
                    "pb-1 text-sm font-medium capitalize transition-colors cursor-pointer",
                    filterStatus === tab
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {isLoading ? (
                [1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-20 w-full bg-muted/60 rounded-xl"
                  />
                ))
              ) : !filteredProducts || filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Box className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-sm">No {filterStatus} products found.</p>
                </div>
              ) : (
                filteredProducts.map((product: Product) => (
                  <div
                    key={product._id}
                    className={cn(
                      "flex items-center justify-between p-4 bg-card rounded-xl border border-border/80 transition-all",
                      !product.isActive && "opacity-60 bg-muted/30 grayscale",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border/40 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Box className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground flex items-center gap-2">
                          {product.name}
                          {!product.isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                              Archived
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {product.category} · RS{product.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-muted-foreground font-mono">
                        Stock: {product.stock}
                      </span>
                      {product.isActive ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(product._id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRestore(product)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Products pagination */}
            {productPagination && productPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  disabled={!productPagination.hasPrevPage}
                  onClick={() => setProductPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {productPagination.page} of{" "}
                  {productPagination.totalPages}
                </span>
                <button
                  disabled={!productPagination.hasNextPage}
                  onClick={() => setProductPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Orders Tab ────────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Status filter */}
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
                  <Skeleton
                    key={i}
                    className="h-24 w-full bg-muted/60 rounded-xl"
                  />
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
                  (
                    order: Order & { user?: { name: string; email: string } },
                  ) => (
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
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
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

                {/* Pagination */}
                {ordersData.pagination &&
                  ordersData.pagination.totalPages > 1 && (
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
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="bg-card border border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will move the product to your archived list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create/Edit Form Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full rounded-xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {editingId ? "Edit product" : "New product"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure listing details. Assets upload securely via
                Cloudinary.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-background border-border text-foreground h-10"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target
                          .value as (typeof PRODUCT_CATEGORY_OPTIONS)[number],
                      })
                    }
                    className="w-full h-10 bg-background border border-border rounded-lg text-foreground text-sm px-3 focus:outline-none"
                  >
                    {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="bg-background border-border h-10"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Price (RS)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="bg-background border-border h-10"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Discount Price (RS)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPrice: e.target.value,
                      })
                    }
                    className="bg-background border-border h-10"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Product Cover Image
                </label>
                <div className="relative flex items-center justify-center w-full border border-dashed border-border hover:border-muted-foreground/40 bg-background rounded-lg p-5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required={!editingId}
                  />
                  <div className="text-center pointer-events-none flex flex-col items-center gap-1">
                    <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {imageFile ? imageFile.name : "Select cover image file"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-3 bg-background border border-border text-foreground text-sm rounded-lg focus:outline-none h-24 resize-none"
                  required
                />
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-lg cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Processing..."
                    : editingId
                      ? "Save Changes"
                      : "Create Listing"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
