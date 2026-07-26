// Manages product lists, page-turning, edit product form fields, and archiving.

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
  useAdminProducts,
  useToggleAdminProduct,
  useUpdateAdminProduct,
} from "@/hooks/useAdmin";
import {
  PRODUCT_CATEGORY_OPTIONS,
  buildProductFormData,
  getProductFormState,
  initialProductFormState,
} from "@/lib/product-form";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types/product.types";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { useState, type FormEvent } from "react";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductsTab() {
  const [productPage, setProductPage] = useState(1);
  const { data: productsData, isLoading: productsLoading } = useAdminProducts(
    productPage,
    true,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialProductFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { mutate: toggleProduct, isPending: isTogglingProduct } =
    useToggleAdminProduct();
  const { mutate: updateProduct, isPending: isUpdatingProduct } =
    useUpdateAdminProduct();

  const products = productsData?.products ?? [];
  const productsPagination = productsData?.pagination;

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

  if (productsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full bg-muted/60 rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Box className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Product Management</h2>
      <div className="space-y-3">
        {products.map((product: Product) => (
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
                  {product.category} &middot; {formatPrice(product.price)}
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
            Page {productsPagination.page} of {productsPagination.totalPages}
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

      {/* Edit Form Dialog */}
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

      {/* Delete Confirmation AlertDialog */}
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
