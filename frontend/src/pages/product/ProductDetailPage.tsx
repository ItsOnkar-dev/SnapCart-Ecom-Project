import { useState } from "react";
import { useParams, Link } from "react-router";
import { Heart, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import RecommendationRail from "@/components/home/RecommendationRail";
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
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();
  const { data: wishlist } = useWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  const [quantity, setQuantity] = useState(1);
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
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No customer reviews yet. Be the first to leave one!</p>
                  )}
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
    </div>
  );
}
