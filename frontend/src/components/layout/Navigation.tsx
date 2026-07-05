// components/layout/Navigation.tsx
// Main navbar — logo, search, wishlist (placeholder), cart (with badge), user menu.
// Category strip below on desktop, slide-out menu on mobile.
// Matches SnapCart's actual product categories from product.types.ts.

import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import UserMenu from "./UserMenu";

// Mirrors ProductCategory type in product.types.ts exactly
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();

  const cartCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  // "Become a seller" only shows for customers — sellers/admins already have that role
  const showBecomeSeller = user?.role === "customer";

  return (
    <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200">
      {/* ── top row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 h-16 px-4 md:px-6 max-w-7xl mx-auto">
        <button
          className="lg:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <ShoppingBag className="w-6 h-6 text-indigo-600" />
          <span className="text-lg font-bold text-gray-900">
            Snap<span className="text-indigo-600">cart</span>
          </span>
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, brands and more..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-full
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
                         placeholder:text-gray-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 ml-auto md:ml-0">
          {/* Wishlist — visual placeholder, no backend feature yet */}
          <button
            className="hidden sm:grid place-items-center p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Favourites"
          >
            <Heart className="w-5 h-5" />
          </button>

          <UserMenu />

          <Link
            to="/cart"
            className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1
                                rounded-full bg-indigo-600 text-white text-[10px] font-semibold"
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-full
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
                       placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ── desktop category strip ─────────────────────────────────────── */}
      <nav className="hidden lg:block border-t border-gray-100">
        <div className="flex items-center gap-6 px-6 h-11 max-w-7xl mx-auto overflow-x-auto">
          <Link
            to="/products"
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors whitespace-nowrap"
          >
            All Products
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${c.slug}`}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
            >
              {c.label}
            </Link>
          ))}
          <Link
            to="/products?sort=newest"
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
          >
            New In
          </Link>

          {showBecomeSeller && (
            <Link
              to="/seller/apply"
              className="ml-auto text-sm font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
            >
              Become a seller
            </Link>
          )}
        </div>
      </nav>

      {/* ── mobile slide-out menu ───────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            <Link
              to="/products"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-base font-medium text-gray-900 hover:text-indigo-600"
            >
              All Products
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={`/products?category=${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-base text-gray-600 hover:text-indigo-600"
              >
                {c.label}
              </Link>
            ))}
            <Link
              to="/products?sort=newest"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-base text-gray-600 hover:text-indigo-600"
            >
              New In
            </Link>

            <div className="pt-3 mt-2 border-t border-gray-200 space-y-1">
              {showBecomeSeller && (
                <Link
                  to="/seller/apply"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-base font-semibold text-indigo-600"
                >
                  Become a seller
                </Link>
              )}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-base text-gray-600 hover:text-indigo-600"
                >
                  Sign in
                </Link>
              )}
              <button
                onClick={() => setMobileOpen(false)}
                className="block w-full text-left py-2.5 text-base text-gray-600 hover:text-indigo-600"
              >
                Favourites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
