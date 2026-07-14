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

  const filteredProducts = products?.filter((p: any) => {
    if (filterStatus === "active") return p.isActive === true;
    if (filterStatus === "archived") return p.isActive === false;
    return true;
  });

  const handleRestore = (product: any) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", product.name);
    formDataToSend.append("description", product.description);
    formDataToSend.append("category", product.category);
    formDataToSend.append("price", String(product.price));
    formDataToSend.append("stock", String(product.stock));
    formDataToSend.append("isActive", "true"); // Ensures the backend sets this to true

    updateMutation.mutate({ id: product._id, body: formDataToSend });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setImageFile(null);
    setIsOpen(true);
  };

  const openEditModal = (product: any) => {
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Seller Dashboard
            </h1>

            {/* Filter Tabs */}
            <div className="flex gap-6 mt-6 border-b border-zinc-800">
              {(["all", "active", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={cn(
                    "pb-2 text-sm font-medium capitalize transition-colors",
                    filterStatus === tab
                      ? "text-zinc-100 border-b-2 border-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={openCreateModal}
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium rounded-lg flex items-center gap-1.5 self-start sm:self-center"
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
                className="h-20 w-full bg-zinc-900/60 rounded-xl"
              />
            ))
          ) : !filteredProducts || filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Box className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm">No {filterStatus} products found.</p>
            </div>
          ) : (
            filteredProducts.map((product: any) => (
              <div
                key={product._id}
                className={cn(
                  "flex items-center justify-between p-4 bg-[#121214] rounded-xl border border-zinc-800/80 transition-all duration-200",
                  !product.isActive && "opacity-60 bg-zinc-900/30 grayscale", // Grey out + Desaturate
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-zinc-800/80 flex items-center justify-center border border-zinc-700/30 overflow-hidden relative">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Box className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                      {product.name}
                      {!product.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                          Archived
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-500 capitalize">
                      {product.category} · RS{product.price}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-sm text-zinc-400 font-mono">
                    Stock: {product.stock}
                  </span>

                  {product.isActive ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(product._id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(product)}
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
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
          <AlertDialogContent className="bg-[#121215] border border-zinc-800 text-zinc-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500">
                This will move the product to your archived list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create/Edit Form Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-[#121215] border border-zinc-800 text-zinc-100 max-w-lg w-full rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {editingId ? "Edit product" : "New product"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Configure listing details. Assets upload securely via
                Cloudinary.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-sm px-3 focus:outline-none"
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
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 h-10"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                    Price (RS)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 h-10"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">
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
                    className="bg-zinc-950 border-zinc-800 h-10"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Product Cover Image Asset
                </label>
                <div className="relative flex items-center justify-center w-full border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950 rounded-lg p-5 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required={!editingId}
                  />
                  <div className="text-center pointer-events-none flex flex-col items-center gap-1">
                    <Upload className="h-4 w-4 text-zinc-500 mb-1" />
                    <span className="text-xs font-medium text-zinc-300">
                      {imageFile ? imageFile.name : "Select cover image file"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Description (Min 10 characters)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-lg focus:outline-none h-24 resize-none"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-10 rounded-lg"
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
