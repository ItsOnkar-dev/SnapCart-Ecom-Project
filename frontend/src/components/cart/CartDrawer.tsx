import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";

import RecommendedProducts from "@/components/home/RecommendedProducts";
import { Button } from "@/components/ui/button";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useCartDrawerStore } from "@/store/cart-drawer.store";
import type { CartItem } from "@/types/cart.types";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getItemPrice = (item: CartItem) =>
  item.product.discountPrice && item.product.discountPrice < item.product.price
    ? item.product.discountPrice
    : item.product.price;

export default function CartDrawer() {
  const { isOpen, close } = useCartDrawerStore();
  const { data: cart, isLoading } = useCart();
  const { mutate: updateCartItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeCartItem, isPending: isRemoving } = useRemoveCartItem();

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum: number, item: CartItem) =>
          sum + getItemPrice(item) * item.quantity,
        0,
      ),
    [items],
  );

  const itemCount = items.reduce(
    (sum: number, item: CartItem) => sum + item.quantity,
    0,
  );

  const cartProductIds: string[] = items.map(
    (item: CartItem) => item.product._id,
  );

  const hasInvalidStock = items.some(
    (item: CartItem) => item.quantity > item.product.stock,
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close cart drawer"
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Shopping Bag
            </h2>
            <p className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Body — scrollbar hidden */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-muted/30"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <ShoppingBag className="mb-4 size-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Your bag is empty
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a few picks and they will appear here.
              </p>
              <Button asChild className="mt-5" onClick={close}>
                <Link to="/products">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: CartItem) => {
                const image = item.product.images?.[0];
                const itemPrice = getItemPrice(item);
                const outOfStock = item.quantity > item.product.stock;

                return (
                  <div
                    key={item._id}
                    className="flex gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    {/* Image */}
                    <Link
                      to={`/products/${item.product._id}`}
                      onClick={close}
                      className="aspect-square size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <Link
                        to={`/products/${item.product._id}`}
                        onClick={close}
                        className="line-clamp-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(itemPrice)} each
                      </p>

                      {outOfStock && (
                        <p className="text-xs text-destructive">
                          Reduce to {item.product.stock}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        {/* Qty controls */}
                        <div className="inline-flex h-7 items-center border border-border bg-background">
                          <button
                            type="button"
                            className="grid size-7 place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                            disabled={item.quantity <= 1 || isUpdating}
                            onClick={() =>
                              updateCartItem({
                                productId: item.product._id,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="grid h-full w-8 place-items-center border-x border-border text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="grid size-7 place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                            disabled={
                              item.quantity >= item.product.stock || isUpdating
                            }
                            onClick={() =>
                              updateCartItem({
                                productId: item.product._id,
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {formatPrice(itemPrice * item.quantity)}
                          </span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            disabled={isRemoving}
                            onClick={() =>
                              removeCartItem(item.product._id)
                            }
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI recommendations inline */}
              {cartProductIds.length > 0 && (
                <div className="pt-3 border-t border-border/60">
                  <RecommendedProducts
                    mode="cart"
                    productIds={cartProductIds}
                    title="You might also like"
                    limit={4}
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatPrice(subtotal)}
              </span>
            </div>

            <Link
              to="/checkout"
              onClick={close}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors cursor-pointer disabled:opacity-50"
              aria-disabled={hasInvalidStock}
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/products"
              onClick={close}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
