import RecommendedProducts from "@/components/home/RecommendedProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAddToCart } from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProducts";
import { useCreateReview, useReviews } from "@/hooks/useReviews";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import type { Review } from "@/types/review.types";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Heart,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-10 bg-muted/30 rounded" />
        <div className="h-3 w-2 bg-muted/20 rounded" />
        <div className="h-3 w-16 bg-muted/30 rounded" />
        <div className="h-3 w-2 bg-muted/20 rounded" />
        <div className="h-3 w-32 bg-muted/30 rounded" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left — image */}
        <div className="rounded-2xl bg-muted/20 aspect-square" />

        {/* Right — info */}
        <div className="space-y-6">
          {/* Category + name + price */}
          <div className="space-y-3">
            <div className="h-3 w-16 bg-muted/30 rounded" />
            <div className="flex justify-between items-start gap-4">
              <div className="h-8 w-2/3 bg-muted/30 rounded" />
              <div className="h-8 w-16 bg-muted/30 rounded" />
            </div>
            <div className="h-3 w-14 bg-emerald-900/40 rounded" />
          </div>

          <div className="h-px bg-border" />

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-muted/30 rounded" />
            <div className="h-10 w-32 bg-muted/20 rounded-lg" />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <div className="flex-1 h-14 bg-muted/20 rounded-xl" />
            <div className="h-14 w-14 bg-muted/20 rounded-xl" />
          </div>

          {/* Accordion rows */}
          <div className="border-t border-border divide-y divide-border pt-4">
            {[
              "Description",
              "Product Details",
              "Care & Cleaning",
              "Customer Reviews",
            ].map((label) => (
              <div
                key={label}
                className="py-4 flex items-center justify-between"
              >
                <div className="h-3.5 w-32 bg-muted/30 rounded" />
                <div className="h-4 w-4 bg-muted/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI picks skeleton */}
      <div className="mt-16 pt-8 border-t border-border/60">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-7 w-7 rounded-full bg-muted/30" />
          <div className="h-6 w-40 bg-muted/30 rounded" />
          <div className="h-5 w-16 bg-muted/20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square rounded-2xl bg-muted/20" />
              <div className="h-3 w-1/3 bg-muted/20 rounded" />
              <div className="h-4 w-2/3 bg-muted/30 rounded" />
              <div className="h-4 w-1/4 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: product, isLoading, error } = useProduct(id);
  const { data: reviewsData } = useReviews(id);
  const { mutate: createReview, isPending: isSubmittingReview } =
    useCreateReview(id ?? "");
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { data: wishlist } = useWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  const [quantity, setQuantity] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    description: false,
    details: false,
    care: false,
    reviews: false,
  });

  // ── Scroll to top on every product navigation ──────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]); // re-fires when product ID changes in the URL

  const toggleSection = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // ── Loading state — page-shaped skeleton, not a centered spinner ───────────
  if (isLoading) return <ProductDetailSkeleton />;

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link to="/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>
    );
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const isInWishlist = wishlist?.items?.some(
    (item: any) =>
      item.product === product._id || item.product?._id === product._id,
  );

  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;
  const reviews = reviewsData?.reviews ?? [];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleWishlistToggle = () => {
    if (!user) {
      toast.error("Please login to manage your wishlist.");
      return;
    }
    if (isInWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  const handleAddToCart = () => addToCart({ productId: product._id, quantity });

  const handleReviewSubmit = (data: {
    rating: number;
    title?: string;
    comment: string;
  }) => {
    if (!user) {
      toast.error("Please login to write a review.");
      return;
    }
    createReview(data, { onSuccess: () => setReviewDialogOpen(false) });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-foreground">
      {/* ── Breadcrumbs — ChevronRight icon matching Lovable design ── */}
      <nav className="text-xs font-medium text-muted-foreground mb-6 flex items-center gap-1 capitalize">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link
          to={`/products?category=${product.category}`}
          className="hover:text-foreground transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-foreground font-semibold truncate">
          {product.name}
        </span>
      </nav>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* ── LEFT: Stacked vertical image gallery ── */}
        <div className="flex flex-col gap-4">
          {product.images && product.images.length > 0 ? (
            product.images.map((src: string, index: number) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden border border-border bg-card/25 aspect-square relative"
              >
                <img
                  src={src}
                  alt={`${product.name} — view ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {index === 0 && hasDiscount && (
                  <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">
                    Sale
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl overflow-hidden border border-border bg-card/25 aspect-square flex items-center justify-center text-muted-foreground text-sm">
              No product image available
            </div>
          )}
        </div>

        {/* ── RIGHT: Product info — sticky on desktop ── */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Category label + name + price — matching Lovable layout exactly */}
          <div>
            <span className="text-xs font-medium text-muted-foreground capitalize tracking-wide">
              {product.category}
            </span>
            <div className="flex justify-between items-start gap-4 mt-1.5">
              <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-foreground">
                  {formatPrice(finalPrice)}
                </p>
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground line-through mt-0.5">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-emerald-400 mt-2 font-medium">
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </p>
          </div>

          <hr className="border-border" />

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Quantity
              </span>
              <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-sm hover:bg-muted/30 transition-colors border-r border-border"
                >
                  −
                </button>
                <span className="px-5 py-2 text-sm font-semibold min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="px-3.5 py-2 text-sm hover:bg-muted/30 transition-colors border-l border-border"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Bag + Wishlist */}
          <div className="flex gap-3">
            <Button
              size="lg"
              disabled={product.stock === 0 || isAdding}
              onClick={handleAddToCart}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-semibold py-6 tracking-wide text-sm rounded-xl"
            >
              {isAdding ? <Spinner className="w-5 h-5" /> : "Add to Bag"}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleWishlistToggle}
              className="h-14 w-14 shrink-0 rounded-xl border-border hover:bg-muted/20"
              aria-label="Toggle wishlist"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isInWishlist ? "fill-red-500 text-red-500" : "text-foreground"
                }`}
              />
            </Button>
          </div>

          {/* ── Accordion panels — all closed by default matching screenshot ── */}
          <div className="border-t border-border divide-y divide-border pt-2">
            {/* Description */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("description")}
                className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors py-0.5"
              >
                <span>Description</span>
                {openSections.description ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {openSections.description && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Product Details */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("details")}
                className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors py-0.5"
              >
                <span>Product Details</span>
                {openSections.details ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {openSections.details && (
                <div className="text-sm text-muted-foreground mt-3 space-y-2">
                  <p>• Premium material configuration</p>
                  <p>• Authentic design craftsmanship</p>
                  <p>• Stock Available: {product.stock} units</p>
                </div>
              )}
            </div>

            {/* Care & Cleaning */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("care")}
                className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors py-0.5"
              >
                <span>Care & Cleaning</span>
                {openSections.care ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {openSections.care && (
                <div className="text-sm text-muted-foreground mt-3 space-y-2">
                  <p>• Hand wash or wipe clean with damp cloth</p>
                  <p>• Keep away from fire or extreme direct heat source</p>
                </div>
              )}
            </div>

            {/* Customer Reviews */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("reviews")}
                className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors py-0.5"
              >
                <span>Customer Reviews</span>
                {openSections.reviews ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {openSections.reviews && (
                <div className="mt-4 space-y-4">
                  {product.totalReviews > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-primary-glow">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold ml-1 text-white">
                            {product.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({product.totalReviews} reviews)
                        </span>
                      </div>
                      <div className="space-y-3">
                        {reviews.map((review: Review) => (
                          <article
                            key={review._id}
                            className="border-t border-border/70 pt-3"
                          >
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                                  {review.user?.name?.charAt(0).toUpperCase() ??
                                    "U"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {review.user?.name ?? "Customer"}
                                  </p>
                                  <div className="flex text-primary-glow">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`size-3.5 ${
                                          i < review.rating
                                            ? "fill-current"
                                            : "text-muted-foreground/40"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {review.title && (
                              <h4 className="mt-2 text-sm font-semibold text-foreground">
                                {review.title}
                              </h4>
                            )}
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {review.comment}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No customer reviews yet. Be the first to leave one!
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 h-12 w-full rounded-none"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    Write a review
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Recommendations ── */}
      <div className="mt-16 pt-8 border-t border-border/60">
        <RecommendedProducts
          mode="product"
          productIds={[product._id]}
          title="You might also like"
          limit={4}
        />
      </div>

      {/* ── Review Dialog ── */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        isSubmitting={isSubmittingReview}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}

// ─── ReviewDialog ─────────────────────────────────────────────────────────────

function ReviewDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (data: { rating: number; title?: string; comment: string }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const canSubmit = rating > 0 && comment.trim().length >= 10;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Please add a rating and at least 10 characters.");
      return;
    }
    onSubmit({
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl rounded-none border border-border bg-popover p-8"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Review product
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground transition hover:text-foreground"
              aria-label="Close review dialog"
            >
              <X className="size-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Rating</p>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="text-muted-foreground transition hover:text-primary-glow"
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star
                      className={`size-7 ${
                        value <= rating
                          ? "fill-primary-glow text-primary-glow"
                          : "fill-muted text-muted"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Title
            </span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum it up"
              maxLength={80}
              className="h-14 rounded-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">
              Your review
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="min-h-32 w-full rounded-none border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              maxLength={500}
            />
          </label>

          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="h-14 w-full rounded-none bg-foreground text-background hover:bg-foreground/90"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4 text-background" />
                Submitting...
              </>
            ) : (
              "Submit review"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
