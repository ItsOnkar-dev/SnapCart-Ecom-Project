import CartDrawer from "@/components/cart/CartDrawer";
import { Logo } from "@/components/home/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import { useCartDrawerStore } from "@/store/cart-drawer.store";
import type { CartItem } from "@/types/cart.types";
import { Heart, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import MobileSidebar from "./MobileSidebar";
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
  const [scrolled, setScrolled] = useState(false);
  const user = useAuthStore((s) => s.user);

  const location = useLocation();
  const isHomepage = location.pathname === "/";
  const isSolid = !isHomepage || scrolled;

  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    const rafId = requestAnimationFrame(handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [location.pathname]);

  const cartCount =
    cart?.items?.reduce(
      (sum: number, item: CartItem) => sum + item.quantity,
      0,
    ) ?? 0;

  const wishlistCount = wishlist?.items?.length ?? 0;
  const showBecomeSeller = user?.role === "customer";

  return (
    <>
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="sticky top-0 z-40 w-full">
        <div
          className={`
          relative z-20 w-full
          transition-[background-color,backdrop-filter] duration-500 ease-out
          ${isSolid ? "bg-background/80 backdrop-blur-2xl" : "bg-transparent"}
        `}
        >
          <div className="flex items-center gap-3 h-16 px-4 max-w-7xl mx-auto">
            <div className="relative lg:hidden shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
              >
                <Menu strokeWidth={3.5} className="w-6 h-6" />
              </Button>
              {/* Wishlist count badge  */}
              {user && wishlistCount > 0 && (
                <span className=" absolute -top-0.5 -right-0.5 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold pointer-events-none">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </div>

            <Logo className="shrink-0" />

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto">
              <SearchAutocomplete />
            </div>

            <div className="flex items-center gap-1 md:gap-2 ml-auto">
              {user && (
                <Link
                  to="/wishlist"
                  className="relative hidden md:grid place-items-center p-2
                          text-nav-foreground hover:text-nav-hover transition-colors"
                  aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span
                      className="
                      absolute -top-1 -right-1
                      grid place-items-center
                      min-w-4.5 h-4.5 px-1
                      rounded-full bg-red-500
                      text-white text-[10px] font-semibold
                    "
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              <button
                type="button"
                onClick={() => useCartDrawerStore.getState().open()}
                className="relative p-2 text-foreground hover:text-nav-hover
                           transition-colors cursor-pointer"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingBagIcon />
                {cartCount > 0 && (
                  <span
                    className="
                    absolute -top-1 -right-1
                    grid place-items-center
                    min-w-4.5 h-4.5 px-1
                    rounded-full bg-red-500
                    text-white text-[10px] font-semibold
                  "
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Theme toggle */}
              {!user && (
                <div className="hidden md:flex items-center">
                  <ThemeToggle
                    showLabel={false}
                    className="p-2 text-nav-foreground hover:text-nav-hover transition-colors"
                  />
                </div>
              )}

              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div
          className={`
          md:hidden px-4 pb-3 relative z-20
          transition-[background-color,backdrop-filter] duration-300 ease-out
          ${isSolid ? "bg-background/80 backdrop-blur-2xl" : "bg-transparent"}
        `}
        >
          <SearchAutocomplete
            placeholder="Search products..."
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>

        {/* Category strip */}
        <nav
          className={`
          hidden lg:block w-full absolute left-0 right-0 top-16 z-10
          transition-all duration-500
          ${
            isSolid
              ? "bg-background/80 backdrop-blur-2xl"
              : "bg-transparent opacity-0 -translate-y-10 pointer-events-none"
          }
        `}
        >
          <div className="flex items-center gap-6 px-6 h-11 max-w-7xl mx-auto overflow-x-auto">
            <Link
              to="/products"
              className="text-sm font-medium text-nav-foreground
                         hover:text-nav-hover transition-colors whitespace-nowrap"
            >
              All Products
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                className="text-sm text-nav-foreground hover:text-nav-hover
                           transition-colors whitespace-nowrap"
              >
                {c.label}
              </Link>
            ))}
            <Link
              to="/products?sort=newest"
              className="text-sm text-nav-foreground hover:text-nav-hover
                         transition-colors whitespace-nowrap"
            >
              New In
            </Link>
            {showBecomeSeller && (
              <Link
                to="/seller/apply"
                className="ml-auto text-sm font-semibold text-primary
                           hover:text-primary-hover whitespace-nowrap"
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
