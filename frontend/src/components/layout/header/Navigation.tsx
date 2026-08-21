import { Heart, Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import CartDrawer from "@/components/cart/CartDrawer";
import MobileSidebar from "./MobileSidebar";
import { Logo } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import { useCartDrawerStore } from "@/store/cart-drawer.store";
import type { CartItem } from "@/types/cart.types";
import SearchAutocomplete from "./SearchAutocomplete";
import UserMenu from "./UserMenu";

const CATEGORIES: { slug: string; label: string }[] = [
  { slug: "electronics", label: "Electronics" },
  { slug: "fashion", label: "Fashion" },
  { slug: "home", label: "Home" },
  { slug: "beauty", label: "Beauty" },
  { slug: "sports", label: "Sports" },
  { slug: "books", label: "Books" },
  { slug: "gaming", label: "Gaming" },
];

export default function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();

  const cartCount =
    cart?.items?.reduce(
      (sum: number, item: CartItem) => sum + item.quantity,
      0,
    ) ?? 0;

  const wishlistCount = wishlist?.items?.length ?? 0;
  const showBecomeSeller = user?.role === "customer";

  return (
    <>
      {/* ── Mobile Sidebar */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="bg-background/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-3 h-16 px-4 md:px-6 max-w-7xl mx-auto">

          {/* Hamburger — opens sidebar, mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-6 h-6" />
          </Button>

          <Logo className="shrink-0" />

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-auto">
            <SearchAutocomplete />
          </div>

          <div className="flex items-center gap-1 md:gap-2 ml-auto md:ml-0">
            <Link
              to="/wishlist"
              className="relative hidden sm:grid place-items-center p-2 text-nav-foreground hover:text-nav-hover transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 grid place-items-center min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <UserMenu />

            <button
              type="button"
              onClick={() => useCartDrawerStore.getState().open()}
              className="relative p-2 text-foreground hover:text-nav-hover transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBagIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid place-items-center min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <SearchAutocomplete
            placeholder="Search products..."
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        <nav className="hidden lg:block border-t border-border/60">
          <div className="flex items-center gap-6 px-6 h-11 max-w-7xl mx-auto overflow-x-auto">
            <Link
              to="/products"
              className="text-sm font-medium text-nav-foreground hover:text-nav-hover transition-colors whitespace-nowrap"
            >
              All Products
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className="text-sm text-nav-foreground hover:text-nav-hover transition-colors whitespace-nowrap"
              >
                {c.label}
              </Link>
            ))}
            <Link
              to="/products?sort=newest"
              className="text-sm text-nav-foreground hover:text-nav-hover transition-colors whitespace-nowrap"
            >
              New In
            </Link>

            {showBecomeSeller && (
              <Link
                to="/seller/apply"
                className="ml-auto text-sm font-semibold text-primary hover:text-primary-hover whitespace-nowrap"
              >
                Become a seller
              </Link>
            )}
          </div>
        </nav>
      </div>

      <CartDrawer />
    </>
  );
}

const ShoppingBagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.7}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
    />
  </svg>
);