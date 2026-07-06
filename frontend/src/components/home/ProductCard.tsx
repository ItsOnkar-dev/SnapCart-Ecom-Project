// Single product tile used by both "New arrivals" and "Trending now" rails.
// Image comes from product.images[0] (backend stores URLs directly).
// Category + name + price mirror the shared homepage screenshot.

import { Link } from "react-router";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";

// backend prices are plain numbers — screenshot shows the € symbol
const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

interface ProductCardProps {
  product: Product;
  showNewBadge?: boolean;
}

export default function ProductCard({
  product,
  showNewBadge = false,
}: ProductCardProps) {
  const image = product.images?.[0];
  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice < product.price;

  return (
    <Link
      to={`/products/${product._id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card",
        "transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card)]",
      )}
    >
      {/* image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {showNewBadge && (
          <Badge className="absolute left-3 top-3 z-10 h-6 px-2.5 text-[11px] font-semibold uppercase tracking-wide">
            New
          </Badge>
        )}
        {image ? (
          <img
            src={image || "/placeholder.svg"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-xs font-medium capitalize text-muted-foreground">
          {product.category}
        </span>
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {product.name}
        </h3>

        {product.totalReviews > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-primary-glow text-primary-glow" />
            <span>{product.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground/70">
              ({product.totalReviews})
            </span>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
