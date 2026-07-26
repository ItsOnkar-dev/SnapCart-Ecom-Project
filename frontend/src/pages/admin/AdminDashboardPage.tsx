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
import {
  useAdminOrders,
  useAdminProducts,
  useAdminProductsCount,
  useAdminSellers,
  useToggleAdminProduct,
  useUpdateAdminProduct,
  useUpdateSellerStatus,
} from "@/hooks/useAdmin";
import {
  PRODUCT_CATEGORY_OPTIONS,
  buildProductFormData,
  getProductFormState,
  initialProductFormState,
} from "@/lib/product-form";
import { cn } from "@/lib/utils";
import type { SellerApplicant } from "@/types/seller.types";
import {
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { Order } from "@/types/order.types";
import type { Product, ProductCategory } from "@/types/product.types";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

type ActiveTab = "analytics" | "products" | "orders" | "sellers";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const {
    data: applicants,
    isLoading: sellersLoading,
    isError: sellersError,
  } = useAdminSellers();
  const { data: productsCount } = useAdminProductsCount();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateSellerStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerApplicant | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<
    "approved" | "rejected" | null
  >(null);

  // Product management state
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialProductFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { mutate: toggleProduct, isPending: isTogglingProduct } =
    useToggleAdminProduct();
  const { mutate: updateProduct, isPending: isUpdatingProduct } =
    useUpdateAdminProduct();

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData(getProductFormState(product));
    setImageFile(null);
    setEditOpen(true);
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(
      {
        id: editingProduct._id,
        body: buildProductFormData(formData, imageFile),
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditingProduct(null);
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      toggleProduct(
        { id: deleteId, isActive: false },
        { onSuccess: () => setDeleteId(null) },
      );
    }
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>("sellers");

  const [orderPage, setOrderPage] = useState(1);
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders(
    orderPage,
    activeTab === "orders",
  );
  const [productPage, setProductPage] = useState(1);

  const { data: productsData, isLoading: productsLoading } = useAdminProducts(
    productPage,
    activeTab === "products",
  );

  const products: Product[] = productsData?.products ?? [];
  const productsPagination = productsData?.pagination;

  const tabs: { key: ActiveTab; label: string; count: number | null }[] = [
    { key: "analytics", label: "Analytics", count: null },
    { key: "products", label: "Products", count: productsCount ?? 0 },
    {
      key: "orders",
      label: "Orders",
      count: ordersData?.pagination?.total ?? 0,
    },
    { key: "sellers", label: "Sellers", count: applicants?.length ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <Link
            to="/account"
            className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
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
                <span
                  className={`text-xs px-1.5 py-0.5 ${
                    activeTab === tab.key
                      ? "bg-muted text-foreground"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products Section */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Product Management</h2>
            {productsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-20 w-full bg-muted/60 rounded-xl"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Box className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  No products found.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className={cn(
                        "flex items-center justify-between p-4 bg-card rounded-xl border border-border/80 transition-all",
                        !product.isActive && "opacity-60 bg-muted/30 grayscale",
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border/40 overflow-hidden shrink-0">
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
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground flex items-center gap-2">
                            <span className="truncate">{product.name}</span>
                            {!product.isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                                Hidden
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {product.category} &middot;{" "}
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <span className="text-sm text-muted-foreground font-mono">
                          Stock: {product.stock}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            aria-label={`Edit ${product.name}`}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              toggleProduct({
                                id: product._id,
                                isActive: !product.isActive,
                              })
                            }
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            aria-label={
                              product.isActive
                                ? `Hide ${product.name}`
                                : `Restore ${product.name}`
                            }
                            title={product.isActive ? "Hide" : "Restore"}
                          >
                            {product.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(product._id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Delete ${product.name}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {productsPagination && productsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      disabled={!productsPagination.hasPrevPage}
                      onClick={() => setProductPage((p) => p - 1)}
                      className="px-3 py-1.5 text-xs font-medium border border-border disabled:opacity-40 hover:bg-muted/30 transition-colors disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      Page {productsPagination.page} of{" "}
                      {productsPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!productsPagination.hasNextPage}
                      onClick={() => setProductPage((p) => p + 1)}
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

        {/* Orders Section */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              All Orders
            </h2>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 bg-card border border-border space-y-2"
                  >
                    <Skeleton className="h-5 w-1/3 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </div>
                ))}
              </div>
            ) : !ordersData?.orders?.length ? (
              <div className="text-center py-12 bg-muted/20 border border-dashed border-border">
                <p className="text-sm text-muted-foreground">
                  No orders found.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {ordersData.orders.map(
                    (
                      order: Order & { user?: { name: string; email: string } },
                    ) => (
                      <div
                        key={order._id}
                        className="p-4 bg-card border border-border hover:border-border/80 transition-colors"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Customer + status row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar initial */}
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                  {(order.user?.name ?? "?")[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground leading-tight">
                                  {order.user?.name ?? "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground leading-tight">
                                  {order.user?.email ?? ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                              <span className="text-base font-bold text-foreground">
                                {formatPrice(order.totalPrice ?? 0)}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize w-fit"
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-border/60" />

                          {/* Product thumbnails */}
                          {order.items?.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2.5 bg-muted/30 hover:bg-muted/60 border border-border/60 px-2.5 py-2 transition-colors min-w-0"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-9 h-9 object-cover shrink-0 rounded-sm"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate max-w-[110px] leading-tight">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                                      {formatPrice(item.price)} ·{" "}
                                      <span className="font-medium">
                                        ×{item.quantity}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className="flex items-center justify-center w-9 h-9 rounded-sm bg-muted/50 border border-dashed border-border text-xs font-medium text-muted-foreground shrink-0">
                                  +{order.items.length - 2}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Date footer */}
                          <p className="text-xs text-muted-foreground/70">
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
                    ),
                  )}
                </div>

                {/* Pagination */}
                {ordersData.pagination &&
                  ordersData.pagination.totalPages > 1 && (
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
          </div>
        )}

        {/* Sellers Section */}
        {activeTab === "sellers" && (
          <div className="space-y-4">
            {sellersLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-6 bg-card border border-border space-y-3"
                  >
                    <Skeleton className="h-6 w-1/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </div>
                ))}
              </div>
            ) : sellersError ? (
              <div className="flex flex-col items-center justify-center p-12 bg-red-950/20 border border-red-900/40 text-center">
                <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-sm font-medium text-red-400">
                  Failed to load seller applications.
                </p>
              </div>
            ) : !applicants || applicants.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 border border-dashed border-border">
                <p className="text-muted-foreground text-sm">
                  No seller applications require review right now.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applicants.map((applicant: SellerApplicant) => (
                  <div
                    key={applicant._id}
                    className="group relative p-6 bg-card border border-border hover:border-border/80 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-foreground tracking-tight">
                            {applicant.name}
                          </h3>
                          <Badge
                            variant={
                              applicant.sellerStatus === "approved"
                                ? "default"
                                : "outline"
                            }
                            className={`capitalize text-xs px-2.5 py-0.5 font-medium ${
                              applicant.sellerStatus === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : applicant.sellerStatus === "rejected"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {applicant.sellerStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {applicant.email}{" "}
                          <span className="text-muted-foreground/50 font-sans mx-1.5">
                            ·
                          </span>{" "}
                          {applicant.phone || "No phone provided"}
                        </p>
                        <div className="pt-2 grid gap-1 text-xs text-muted-foreground">
                          <p>
                            <span className="text-muted-foreground font-medium">
                              Business ID:
                            </span>{" "}
                            {applicant.businessId || "N/A"}
                          </p>
                          <p className="leading-relaxed">
                            <span className="text-muted-foreground font-medium">
                              Address:
                            </span>{" "}
                            {applicant.address || "N/A"}
                          </p>
                        </div>
                      </div>
                      {applicant.sellerStatus === "pending" && (
                        <div className="flex items-center gap-2 self-end md:self-start pt-2 md:pt-0">
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => {
                              setSelectedSeller(applicant);
                              setSelectedStatus("approved");
                              setDialogOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white gap-1.5 shadow-md shadow-emerald-950/20 transition-all"
                          >
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => {
                              setSelectedSeller(applicant);
                              setSelectedStatus("rejected");
                              setDialogOpen(true);
                            }}
                            className="border-border cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 gap-1.5 transition-all"
                          >
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
            <AlertDialogTitle>
              {selectedStatus === "approved"
                ? "Approve seller application?"
                : "Reject seller application?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <strong>{selectedStatus}</strong>{" "}
              <strong>{selectedSeller?.name}</strong>'s seller application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={
                selectedStatus === "approved" ? "default" : "destructive"
              }
              disabled={isUpdating}
              onClick={() => {
                if (!selectedSeller || !selectedStatus) return;
                updateStatus({
                  id: selectedSeller._id,
                  status: selectedStatus,
                });
                setDialogOpen(false);
                setSelectedSeller(null);
                setSelectedStatus(null);
              }}
            >
              {isUpdating
                ? selectedStatus === "approved"
                  ? "Approving..."
                  : "Rejecting..."
                : selectedStatus === "approved"
                  ? "Approve"
                  : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Edit product
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure listing details. Assets upload securely via Cloudinary.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
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
                      category: e.target.value as Exclude<
                        ProductCategory,
                        "All Products"
                      >,
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
                    setFormData({ ...formData, discountPrice: e.target.value })
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
                disabled={isUpdatingProduct}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-lg cursor-pointer"
              >
                {isUpdatingProduct ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove this product from the storefront?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This archives the product so shoppers cannot buy it, while keeping
              order history and analytics intact. You can restore it later with
              the eye button.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isTogglingProduct}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isTogglingProduct ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
