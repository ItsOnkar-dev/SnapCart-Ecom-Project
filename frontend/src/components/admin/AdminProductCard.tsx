import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";
import { Eye, EyeOff, PackageX, Pencil, Trash2 } from "lucide-react";

interface AdminProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggle: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminProductCard({
  product,
  onEdit,
  onToggle,
  onDelete,
}: AdminProductCardProps) {
  const image = product.images?.[0];
  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice !== null &&
    product.discountPrice < product.price;

  const isLowStock = product.stock < 10;

  const sellerName =
    typeof product.seller === "object" ? product.seller.name : "Unknown";

  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl overflow-hidden border border-border bg-card",
        "transition-all duration-300 hover:border-primary/40 hover:shadow-[var(--shadow-card)]",
        !product.isActive && "opacity-60",
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <PackageX className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <Badge
            className={cn(
              "text-[9px] px-1.5 py-0 font-semibold uppercase tracking-wide",
              product.isActive
                ? "bg-emerald-600/90 text-white"
                : "bg-rose-600/90 text-white",
            )}
          >
            {product.isActive ? "Active" : "Hidden"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
          {product.category}
        </p>
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-foreground">
            {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock + Seller */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[11px] font-medium",
              isLowStock ? "text-rose-500" : "text-muted-foreground",
            )}
          >
            {isLowStock ? `⚠ ${product.stock} left` : `Stock: ${product.stock}`}
          </span>
          <span className="text-muted-foreground/25 text-xs">·</span>
          <span className="truncate text-[11px] text-muted-foreground max-w-[120px]">
            {sellerName}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-2">
        <button
          onClick={() => onEdit(product)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground bg-transparent hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200 cursor-pointer"
          aria-label="Edit product"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>

        <button
          onClick={() => onToggle(product)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground bg-transparent hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200 cursor-pointer"
        >
          {product.isActive ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {product.isActive ? "Hide" : "Restore"}
        </button>

        <button
          onClick={() => onDelete(product._id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground bg-transparent hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-200 cursor-pointer"
          aria-label="Delete product"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
