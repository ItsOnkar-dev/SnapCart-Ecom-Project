import { useParams, Link } from "react-router";
import { Heart, ShoppingBag, ExternalLink, LogIn } from "lucide-react";
import { useSharedWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/ui/spinner";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

export default function WishlistSharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: wishlist, isLoading, error } = useSharedWishlist(shareId ?? "");
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-white" />
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold">Wishlist Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          This wishlist might not exist, or the owner has disabled public sharing.
        </p>
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const items = wishlist.items ?? [];
  const ownerName = wishlist.user?.name ?? "A friend";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-foreground">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-full mb-4">
          <Heart className="w-8 h-8 text-indigo-400 fill-indigo-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {ownerName}'s Wishlist
        </h1>
        <p className="text-muted-foreground mt-2">
          Take a look at what products {ownerName} has saved. You can buy them or view details below.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-card/40 max-w-xl mx-auto">
          <Heart className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold">This wishlist is empty</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The owner hasn't added any products to this wishlist yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
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

                {/* Metadata */}
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">
                    {prod.category}
                  </span>
                  <Link to={`/products/${prod._id}`} className="hover:underline">
                    <h3 className="line-clamp-1 text-sm font-semibold text-foreground mt-1">
                      {prod.name}
                    </h3>
                  </Link>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(prod.price)}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    {user ? (
                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold bg-white text-black hover:bg-neutral-200"
                        disabled={!prod.isActive || prod.stock === 0 || isAdding}
                        onClick={() => addToCart({ productId: prod._id, quantity: 1 })}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                        Add to Cart
                      </Button>
                    ) : (
                      <Link to="/login" className="w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs font-semibold border-border hover:bg-muted"
                        >
                          <LogIn className="w-3.5 h-3.5 mr-1" />
                          Login to Add to Cart
                        </Button>
                      </Link>
                    )}
                    <Link to={`/products/${prod._id}`} className="w-full">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground hover:text-white"
                      >
                        View Product
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
