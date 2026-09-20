import { AppearanceRow } from "@/components/ui/ThemeToggle";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import {
  BookOpen,
  ChevronRight,
  Cpu,
  Gamepad2,
  Heart,
  Home,
  LogIn,
  Shirt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";

const CATEGORIES = [
  { slug: "electronics", label: "Electronics", icon: Cpu },
  { slug: "fashion", label: "Fashion", icon: Shirt },
  { slug: "home", label: "Home", icon: Home },
  { slug: "beauty", label: "Beauty", icon: Sparkles },
  { slug: "sports", label: "Sports", icon: Zap },
  { slug: "books", label: "Books", icon: BookOpen },
  { slug: "gaming", label: "Gaming", icon: Gamepad2 },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { data: wishlist } = useWishlist();
  const wishlistCount = wishlist?.items?.length ?? 0;
  const location = useLocation();

  useScrollLock(open);

  useEffect(() => {
    onClose();
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const showBecomeSeller = user?.role === "customer";

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed inset-y-0 left-0 z-50 h-dvh w-80 max-w-[85vw]
          bg-background/95 backdrop-blur-2xl
          border-r border-border/40
          flex flex-col shadow-2xl shadow-black/50
          transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/40 shrink-0">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid place-items-center w-8 h-8 rounded-full bg-muted/60 text-foreground/80 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6 scrollbar-hide">
          <div>
            <p className="px-2 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
              Browse
            </p>
            <div className="space-y-1">
              <Link
                to="/products"
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200
                  ${
                    location.pathname === "/products" && !location.search
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center text-primary group-hover:scale-105 transition-transform shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  All Products
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
              </Link>

              <Link
                to="/products?sort=newest"
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200
                  ${
                    location.search === "?sort=newest"
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center text-emerald-500 group-hover:scale-105 transition-transform shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  New In
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
              </Link>

              <Link
                to="/wishlist"
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200
                  ${
                    location.pathname === "/wishlist"
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center text-rose-500 group-hover:scale-105 transition-transform shrink-0">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                  </div>
                  Favourites
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {wishlistCount > 0 && (
                    <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500/15 text-rose-500 text-[10px] font-bold">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
                </div>
              </Link>
            </div>
          </div>

          <div className="h-px bg-border/40 mx-2" />

          <div>
            <p className="px-2 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground">
              Categories
            </p>
            <div className="space-y-0.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.slug}
                    to={`/products?category=${c.slug}`}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
                      ${
                        location.search === `?category=${c.slug}`
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                      {c.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {showBecomeSeller && (
            <div className="pt-2">
              <Link
                to="/seller/apply"
                className="flex items-center justify-between p-3.5 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">
                      Become a Seller
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Start selling on SnapCart today
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/50 bg-background/50 p-4 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* Theme Switcher Row */}
          <div className="px-1">
            <AppearanceRow variant="sidebar" />
          </div>

          {user ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/40">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-primary/15 text-primary text-sm font-bold uppercase shrink-0 ring-1 ring-primary/20">
                {user.name?.[0] ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              Sign In to Account
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
