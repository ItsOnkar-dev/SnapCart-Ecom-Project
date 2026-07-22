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
  useCreateProduct,
  useDeleteProduct,
  useSellerProducts,
  useUpdateProduct,
} from "@/hooks/useSellerProducts";
import type { Product } from "@/types/product.types";
import { Box, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import React, { useState } from "react";

// Helper for conditional classes
const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

const initialFormState = {
  name: "",
  description: "",
  category: "electronics",
  price: "",
  stock: "",
  discountPrice: "",
};

export default function SellerProductsPage() {
  const { data: products, isLoading } = useSellerProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Modal & UI States
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Filtering Logic
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "archived"
  >("all");

  const filteredProducts = products?.filter((p: Product) => {
    if (filterStatus === "active") return p.isActive === true;
    if (filterStatus === "archived") return p.isActive === false;
    return true;
  });

  const handleRestore = (product: Product) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", product.name);
    formDataToSend.append("description", product.description);
    formDataToSend.append("category", product.category);
    formDataToSend.append("price", String(product.price));
    formDataToSend.append("stock", String(product.stock));
    formDataToSend.append("isActive", "true");

    updateMutation.mutate({ id: product._id, body: formDataToSend });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setImageFile(null);
    setIsOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "electronics",
      price: product.price ? String(product.price) : "",
      stock: product.stock ? String(product.stock) : "",
      discountPrice: product.discountPrice ? String(product.discountPrice) : "",
    });
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
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("description", formData.description.trim());
    formDataToSend.append("category", formData.category);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock", formData.stock);
    if (formData.discountPrice)
      formDataToSend.append("discountPrice", formData.discountPrice);
    if (imageFile) formDataToSend.append("image", imageFile);

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, body: formDataToSend },
        { onSuccess: () => setIsOpen(false) },
      );
    } else {
      createMutation.mutate(formDataToSend, {
        onSuccess: () => setIsOpen(false),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Seller Dashboard
            </h1>

            {/* Filter Tabs */}
            <div className="flex gap-6 mt-6 border-b border-border">
              {(["all", "active", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={cn(
                    "pb-2 text-sm font-medium capitalize transition-colors cursor-pointer",
                    filterStatus === tab
                      ? "text-foreground border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={openCreateModal}
            className="bg-primary text-primary-foreground hover:bg-primary-hover font-medium rounded-lg flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New product
          </Button>
        </div>

        {/* Workspace Feed */}
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
                  "flex items-center justify-between p-4 bg-card rounded-xl border border-border/80 transition-all duration-200",
                  !product.isActive && "opacity-60 bg-muted/30 grayscale",
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border/40 overflow-hidden relative">
                    {product.images && product.images[0] ? (
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
          <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full rounded-xl max-h-[90vh] overflow-y-auto">
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
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full h-10 bg-background border border-border rounded-lg text-foreground text-sm px-3 focus:outline-none"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="fashion">Fashion</option>
                    <option value="home">Home</option>
                    <option value="beauty">Beauty</option>
                    <option value="sports">Sports</option>
                    <option value="books">Books</option>
                    <option value="gaming">Gaming</option>
                    <option value="new in">New In</option>
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
                    Discount Price (RS) - Optional
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
                  Product Cover Image Asset
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
                  Description (Min 10 characters)
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
