// Single product tile used by both "New arrivals" and "Trending now" rails.
// Image comes from product.images[0] (backend stores URLs directly).
// Category + name + price mirror the shared homepage screenshot.

import { Link } from "react-router";
import { Star, Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

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
  const user = useAuthStore((s) => s.user);
  const { data: wishlist } = useWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  const image = product.images?.[0];
  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice < product.price;

  const isInWishlist = wishlist?.items?.some(
    (item: any) =>
      item.product === product._id ||
      item.product?._id === product._id
  );

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add products to your wishlist.");
      return;
    }

    if (isInWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  return (
    <Link 
      to={`/products/${product._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card",
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
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleWishlistToggle}
          className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full bg-black/45 backdrop-blur-md hover:bg-black/75 border border-white/10"
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isInWishlist ? "fill-red-500 text-red-500" : "text-white"
            )}
          />
        </Button>

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
