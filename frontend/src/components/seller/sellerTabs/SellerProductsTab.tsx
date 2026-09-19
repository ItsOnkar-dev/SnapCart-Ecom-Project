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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateProduct,
  useDeleteProduct,
  useSellerProducts,
  useUpdateProduct,
} from "@/hooks/useSellerProducts";
import {
  buildProductFormData,
  getProductFormState,
  initialProductFormState,
} from "@/lib/product-form";
import type { Product } from "@/types/product.types";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { ProductFormDialog } from "../ProductFormDialog";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

interface SellerProductsTabProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function SellerProductsTab({
  isModalOpen,
  setIsModalOpen,
}: SellerProductsTabProps) {
  const [productPage, setProductPage] = useState(1);
  const { data: productsData, isLoading } = useSellerProducts(productPage);
  const products = productsData?.products ?? [];
  const productPagination = productsData?.pagination;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialProductFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "archived"
  >("all");

  const filteredProducts = products.filter((p: Product) => {
    if (filterStatus === "active") return p.isActive === true;
    if (filterStatus === "archived") return p.isActive === false;
    return true;
  });

  const handleRestore = (product: Product) => {
    const fd = buildProductFormData(getProductFormState(product));
    fd.append("isActive", "true");
    updateMutation.mutate({ id: product._id, body: fd });
  };

  const openEditModal = (product: Product) => {
    setEditingId(product._id);
    setFormData(getProductFormState(product));
    setImageFile(null);
    setIsModalOpen(true);
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
        { onSuccess: () => setIsModalOpen(false) },
      );
    } else {
      createMutation.mutate(fd, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  return (
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
            <Skeleton key={i} className="h-20 w-full bg-muted/60 rounded-xl" />
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

      {/* Pagination */}
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
            Page {productPagination.page} of {productPagination.totalPages}
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

      {/* Delete Confirmation Alert */}
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

      {/* Form Dialog */}
      <ProductFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        isEditing={!!editingId}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        formData={formData}
        setFormData={setFormData}
        imageFile={imageFile}
        setImageFile={setImageFile}
        onSubmit={handleSubmit}
      />
    </>
  );
}
