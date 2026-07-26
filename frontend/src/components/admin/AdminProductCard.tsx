import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";
import { Box, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

interface AdminProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export default function AdminProductCard({
  product,
  onEdit,
  onToggle,
  onDelete,
}: AdminProductCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-card rounded-xl border border-border/80 transition-all",
        !product.isActive && "opacity-60 bg-muted/30 grayscale",
      )}
    >
      {/* Product Information */}
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

      {/* Stock and Actions */}
      <div className="flex items-center gap-6 shrink-0">
        <span className="text-sm text-muted-foreground font-mono hidden sm:inline">
          Stock: {product.stock}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
            aria-label={`Edit ${product.name}`}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggle(product._id, !product.isActive)}
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
            onClick={() => onDelete(product._id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
            aria-label={`Delete ${product.name}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
