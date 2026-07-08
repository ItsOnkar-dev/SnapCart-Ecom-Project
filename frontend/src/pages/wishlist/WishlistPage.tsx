import { useState } from "react";
import { Link } from "react-router";
import { Heart, Trash2, ShoppingBag, Share2, Copy, Mail } from "lucide-react";
import {
  useWishlist,
  useRemoveFromWishlist,
  useMoveWishlistToCart,
  useToggleWishlistShare,
  useEmailWishlist,
} from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlist();
  const { mutate: removeFromWishlist, isPending: isRemoving } = useRemoveFromWishlist();
  const { mutate: moveAllToCart, isPending: isMoving } = useMoveWishlistToCart();
  const { mutate: toggleShare, isPending: isTogglingShare } = useToggleWishlistShare();
  const { mutate: emailWishlist, isPending: isEmailing } = useEmailWishlist();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const items = wishlist?.items ?? [];
  const shareEnabled = wishlist?.shareEnabled ?? false;
  const shareId = wishlist?.shareId;

  const publicLink = shareId
    ? `${window.location.origin}/wishlist/share/${shareId}`
    : "";

  const handleCopyLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    emailWishlist(recipientEmail, {
      onSuccess: () => setRecipientEmail(""),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved products, share your list, or move them to cart.
          </p>
        </div>

        {items.length > 0 && (
          <Button
            onClick={() => moveAllToCart()}
            disabled={isMoving}
            className="shrink-0 bg-white hover:bg-neutral-200 text-black font-semibold flex items-center gap-2"
          >
            {isMoving ? <Spinner className="w-4 h-4 text-black" /> : <ShoppingBag className="w-4 h-4" />}
            Move All to Cart
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-card/40">
              <Heart className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
                Explore our catalog and click the heart icon on your favorite products to save them here.
              </p>
              <Link to="/products">
                <Button variant="outline">Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item: any) => {
                const prod = item.product;
                if (!prod) return null;
                const hasDiscount = typeof prod.discountPrice === "number" && prod.discountPrice < prod.price;
                const finalPrice = hasDiscount ? prod.discountPrice : prod.price;

                return (
                  <div
                    key={prod._id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
                  >
                    {/* Image section */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {prod.images?.[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                      {!prod.isActive && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                          Unavailable
                        </Badge>
                      )}
                      {prod.stock === 0 && (
                        <Badge variant="secondary" className="absolute top-2 right-2">
                          Out of stock
                        </Badge>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {prod.category}
                      </span>
                      <Link to={`/products/${prod._id}`} className="hover:underline">
                        <h3 className="line-clamp-1 text-sm font-semibold text-foreground mt-1">
                          {prod.name}
                        </h3>
                      </Link>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {formatPrice(finalPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(prod.price)}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white"
                          disabled={!prod.isActive || prod.stock === 0 || isAddingToCart}
                          onClick={() => addToCart({ productId: prod._id, quantity: 1 })}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 px-2"
                          disabled={isRemoving}
                          onClick={() => removeFromWishlist(prod._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Sharing Panel */}
        <div className="space-y-6">
          <div className="border border-border bg-card/60 backdrop-blur-md rounded-2xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-indigo-400" />
              Wishlist Sharing
            </h2>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Enable wishlist sharing to let family and friends view your saved products or purchase items directly.
            </p>

            <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl mb-6">
              <span className="text-sm font-medium">Public Sharing</span>
              <Button
                variant={shareEnabled ? "default" : "outline"}
                size="sm"
                disabled={isTogglingShare}
                onClick={() => toggleShare(!shareEnabled)}
                className="font-semibold transition-all duration-200"
              >
                {isTogglingShare ? <Spinner className="w-4 h-4" /> : shareEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {shareEnabled && shareId && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Your Wishlist Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={publicLink}
                      className="bg-muted/50 border-border text-xs focus:ring-0"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="shrink-0"
                      aria-label="Copy link"
                    >
                      <Copy className={`w-4 h-4 ${copied ? "text-green-400" : ""}`} />
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email Wishlist to Someone
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        required
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="bg-muted/50 border-border text-xs"
                      />
                      <Button
                        type="submit"
                        disabled={isEmailing}
                        className="shrink-0 text-xs font-bold bg-white text-black hover:bg-neutral-200"
                      >
                        {isEmailing ? <Spinner className="w-4 h-4 text-black" /> : "Send"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
