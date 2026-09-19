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
import type { ProductFormState } from "@/lib/product-form";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/product-form";
import { Upload } from "lucide-react";
import React from "react";

interface ProductFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  formData: ProductFormState;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormState>>;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  isEditing,
  isSubmitting,
  formData,
  setFormData,
  imageFile,
  setImageFile,
  onSubmit,
}: ProductFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-lg w-full rounded-xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? "Edit product" : "New product"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure listing details. Assets upload securely via Cloudinary.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
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
                required={!isEditing}
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
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-lg cursor-pointer"
            >
              {isSubmitting
                ? "Processing..."
                : isEditing
                  ? "Save Changes"
                  : "Create Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
