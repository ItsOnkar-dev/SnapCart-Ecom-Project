import { useState } from "react";
import { useParams, Link } from "react-router";
import { Heart, ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useCreateReview, useReviews } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecommendationRail from "@/components/home/RecommendationRail";
import type { Review } from "@/types/review.types";
import toast from "react-hot-toast";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: product, isLoading, error } = useProduct(id);
  const { data: reviewsData } = useReviews(id);
  const { mutate: createReview, isPending: isSubmittingReview } = useCreateReview(id ?? "");
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { data: wishlist } = useWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  const [quantity, setQuantity] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    description: true,
    details: false,
    care: false,
    reviews: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    );
  }

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

  const isInWishlist = wishlist?.items?.some(
    (item: any) => item.product === product._id || item.product?._id === product._id
  );

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

  const handleAddToCart = () => {
    addToCart({ productId: product._id, quantity });
  };

  const reviews = reviewsData?.reviews ?? [];

  const handleReviewSubmit = (data: {
    rating: number;
    title?: string;
    comment: string;
  }) => {
    if (!user) {
      toast.error("Please login to write a review.");
      return;
    }

    createReview(data, {
      onSuccess: () => setReviewDialogOpen(false),
    });
  };

  const hasDiscount = typeof product.discountPrice === "number" && product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice : product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-foreground">
      {/* Breadcrumbs */}
      <nav className="text-xs font-medium text-muted-foreground mb-6 flex items-center gap-1.5 capitalize">
        <Link to="/" className="hover:text-white">Home</Link>
        <span>&gt;</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-white">{product.category}</Link>
        <span>&gt;</span>
        <span className="text-white truncate">{product.name}</span>
      </nav>

      {/* Main product info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Image */}
        <div className="rounded-2xl overflow-hidden border border-border bg-card/25 aspect-square relative">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              No product image available
            </div>
          )}
          {hasDiscount && (
            <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">
              Sale
            </Badge>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
              {product.category}
            </span>
            <div className="flex justify-between items-start gap-4 mt-2">
              <h1 className="text-3xl font-extrabold tracking-tight">{product.name}</h1>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">
                  {formatPrice(finalPrice)}
                </span>
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground line-through">
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
              <span className="text-sm font-medium text-muted-foreground">Quantity</span>
              <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-sm hover:bg-neutral-800 transition-colors border-r border-border"
                >
                  -
                </button>
                <span className="px-5 text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3.5 py-1.5 text-sm hover:bg-neutral-800 transition-colors border-l border-border"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Cart & Wishlist Actions */}
          <div className="flex gap-4">
            <Button
              size="lg"
              disabled={product.stock === 0 || isAdding}
              onClick={handleAddToCart}
              className="flex-1 bg-white hover:bg-neutral-200 text-black font-extrabold uppercase py-6 tracking-wide text-xs"
            >
              {isAdding ? <Spinner className="w-5 h-5 text-black" /> : "Add to Bag"}
            </Button>

            <Button
              size="icon"
              variant="outline"
              onClick={handleWishlistToggle}
              className="h-14 w-14 shrink-0 rounded-xl border-border hover:bg-neutral-900"
              aria-label="Toggle wishlist"
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? "fill-red-500 text-red-500" : "text-white"}`} />
            </Button>
          </div>

          {/* Accordion Panels */}
          <div className="border-t border-border divide-y divide-border pt-4">
            {/* Description */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("description")}
                className="w-full flex items-center justify-between font-bold text-sm text-foreground hover:text-white"
              >
                Description
                {openSections.description ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                className="w-full flex items-center justify-between font-bold text-sm text-foreground hover:text-white"
              >
                Product Details
                {openSections.details ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                className="w-full flex items-center justify-between font-bold text-sm text-foreground hover:text-white"
              >
                Care & Cleaning
                {openSections.care ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.care && (
                <div className="text-sm text-muted-foreground mt-3 space-y-2">
                  <p>• Hand wash or wipe clean with damp cloth</p>
                  <p>• Keep away from fire or extreme direct heat source</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("reviews")}
                className="w-full flex items-center justify-between font-bold text-sm text-foreground hover:text-white"
              >
                Customer Reviews
                {openSections.reviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSections.reviews && (
                <div className="mt-4 space-y-4">
                  {product.totalReviews > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-primary-glow">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold ml-1 text-white">{product.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({product.totalReviews} reviews)</span>
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
                                  {review.user?.name?.charAt(0).toUpperCase() ?? "U"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {review.user?.name ?? "Customer"}
                                  </p>
                                  <div className="flex text-primary-glow">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <Star
                                        key={index}
                                        className={`size-3.5 ${
                                          index < review.rating ? "fill-current" : "text-muted-foreground/40"
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
                    <p className="text-sm text-muted-foreground">No customer reviews yet. Be the first to leave one!</p>
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

      {/* AI Recommendations */}
      <div className="mt-16 pt-8 border-t border-border/60">
        <RecommendationRail
          title="You might also like"
          subtitle="Frequently bought together or similar items picked by AI"
          productId={product._id}
          type="related"
          limit={4}
        />
      </div>

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        isSubmitting={isSubmittingReview}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}

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
                        value <= rating ? "fill-primary-glow text-primary-glow" : "fill-muted text-muted"
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
              onChange={(event) => setTitle(event.target.value)}
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
              onChange={(event) => setComment(event.target.value)}
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
