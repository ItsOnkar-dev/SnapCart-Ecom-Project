import {
  ArrowRight,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddToCart,
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/useCart";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { CartItem } from "@/types/cart.types";
import type { ShippingAddress } from "@/types/order.types";
import type { Product } from "@/types/product.types";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const emptyAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

const getItemPrice = (item: CartItem) =>
  item.product.discountPrice && item.product.discountPrice < item.product.price
    ? item.product.discountPrice
    : item.product.price;

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const { mutate: updateCartItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeCartItem, isPending: isRemoving } = useRemoveCartItem();
  const { mutate: addToCart, isPending: isAddingPick } = useAddToCart();
  const { mutate: placeOrder, isPending: isPlacingOrder } = usePlaceOrder();
  const { data: recommendedProducts = [], isLoading: isLoadingPicks } =
    useRecommendations({ type: "personalized", limit: 6 });
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);

  const items = cart?.items ?? [];
  const cartProductIds = new Set(
    items.map((item: CartItem) => item.product._id),
  );
  const aiPicks = (recommendedProducts as Product[])
    .filter((product) => !cartProductIds.has(product._id))
    .slice(0, 2);
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
  const shipping = subtotal >= 75 || subtotal === 0 ? 0 : 8;
  const total = subtotal + shipping;

  const hasInvalidStock = items.some(
    (item: CartItem) => item.quantity > item.product.stock,
  );
  const canCheckout =
    items.length > 0 &&
    !hasInvalidStock &&
    Object.values(address).every((value) => value.trim().length > 0);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
  };

  const handleQuantityChange = (item: CartItem, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem({ productId: item.product._id, quantity });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCheckout) return;
    placeOrder(address);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 md:px-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-10 w-56 rounded-lg bg-muted animate-pulse" />
          <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
            <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />
            <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Home / Shopping Bag
            </p>
            <h1 className="text-3xl font-bold text-foreground md:text-5xl">
              Shopping Bag
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout
          </p>
        </div>

        {items.length === 0 ? (
          <section className="grid min-h-[420px] place-items-center rounded-2xl border border-border bg-card px-6 text-center">
            <div>
              <PackageCheck className="mx-auto mb-5 size-12 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Your bag is empty
              </h2>
              <p className="mt-2 text-muted-foreground">
                Add a few Snapcart picks and they will appear here.
              </p>
              <Button asChild className="mt-6">
                <Link to="/products">Start shopping</Link>
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_520px]">
            <section className="space-y-4">
              {items.map((item: CartItem) => {
                const image = item.product.images?.[0];
                const itemPrice = getItemPrice(item);
                const outOfStock = item.quantity > item.product.stock;

                return (
                  <article
                    key={item._id}
                    className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[132px_1fr_auto]"
                  >
                    <Link
                      to={`/products/${item.product._id}`}
                      className="aspect-square overflow-hidden rounded-xl bg-muted"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-sm text-muted-foreground">
                          No image
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.product._id}`}
                        className="line-clamp-1 text-lg font-semibold text-foreground hover:text-primary"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.product.stock > 0
                          ? `${item.product.stock} in stock`
                          : "Out of stock"}
                      </p>
                      {outOfStock && (
                        <p className="mt-2 text-sm text-destructive">
                          Reduce quantity to {item.product.stock} before
                          checkout.
                        </p>
                      )}

                      <div className="mt-5 inline-flex h-11 items-center border border-border bg-background">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-none"
                          disabled={item.quantity <= 1 || isUpdating}
                          onClick={() =>
                            handleQuantityChange(item, item.quantity - 1)
                          }
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="grid h-full w-12 place-items-center border-x border-border text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-none"
                          disabled={
                            item.quantity >= item.product.stock || isUpdating
                          }
                          onClick={() =>
                            handleQuantityChange(item, item.quantity + 1)
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 md:block md:text-right">
                      <p className="text-lg font-bold text-foreground">
                        {formatPrice(itemPrice * item.quantity)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0 text-muted-foreground hover:text-destructive md:mt-5"
                        disabled={isRemoving}
                        onClick={() => removeCartItem(item.product._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border bg-sidebar p-6 shadow-[var(--shadow-card)]"
              >
                <div className="mb-6 flex items-center justify-between border-b border-sidebar-border pb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      Checkout
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Secure order details
                    </p>
                  </div>
                  <ShieldCheck className="size-6 text-primary-glow" />
                </div>

                {(isLoadingPicks || aiPicks.length > 0) && (
                  <section className="mb-6 border-b border-sidebar-border pb-6">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Sparkles className="size-4 fill-current" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-foreground">
                            Complete your order
                          </h3>
                          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-glow">
                            AI picks
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Smart additions based on your shopping signals
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {isLoadingPicks
                        ? Array.from({ length: 2 }).map((_, index) => (
                            <div
                              key={index}
                              className="aspect-[4/5] animate-pulse rounded-xl border border-sidebar-border bg-muted"
                            />
                          ))
                        : aiPicks.map((product) => {
                            const image = product.images?.[0];
                            const pickPrice =
                              product.discountPrice &&
                              product.discountPrice < product.price
                                ? product.discountPrice
                                : product.price;

                            return (
                              <article
                                key={product._id}
                                className="overflow-hidden rounded-xl border border-sidebar-border bg-background"
                              >
                                <Link
                                  to={`/products/${product._id}`}
                                  className="block aspect-square overflow-hidden bg-muted"
                                >
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={product.name}
                                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                  ) : (
                                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </Link>
                                <div className="p-3">
                                  <Link
                                    to={`/products/${product._id}`}
                                    className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary"
                                  >
                                    {product.name}
                                  </Link>
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-foreground">
                                      {formatPrice(pickPrice)}
                                    </span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 rounded-md px-3"
                                      disabled={
                                        isAddingPick || product.stock < 1
                                      }
                                      onClick={() =>
                                        addToCart({
                                          productId: product._id,
                                          quantity: 1,
                                        })
                                      }
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                    </div>
                  </section>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Full name"
                    value={address.fullName}
                    onChange={(e) =>
                      handleAddressChange("fullName", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={address.phone}
                    onChange={(e) =>
                      handleAddressChange("phone", e.target.value)
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Street address"
                    value={address.street}
                    onChange={(e) =>
                      handleAddressChange("street", e.target.value)
                    }
                  />
                  <Input
                    placeholder="City"
                    value={address.city}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                  />
                  <Input
                    placeholder="State"
                    value={address.state}
                    onChange={(e) =>
                      handleAddressChange("state", e.target.value)
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Pincode"
                    value={address.pincode}
                    onChange={(e) =>
                      handleAddressChange("pincode", e.target.value)
                    }
                  />
                </div>

                <div className="my-6 space-y-3 border-y border-sidebar-border py-5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-foreground">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-md"
                  disabled={!canCheckout || isPlacingOrder}
                >
                  Proceed to Checkout
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  size="lg"
                  className="mt-3 h-12 w-full rounded-md"
                >
                  <Link to="/products">Continue Shopping</Link>
                </Button>
              </form>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
