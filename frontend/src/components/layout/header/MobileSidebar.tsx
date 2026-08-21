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

import { useAuthStore } from "@/store/auth.store";

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
  const location = useLocation();

  // Close on route change
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

  useEffect(() => {
    if (open) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  const showBecomeSeller = user?.role === "customer";

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
          transition-opacity duration-300 ease-out
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed top-0 left-0 z-50 h-[100dvh] w-[300px] max-w-[85vw]
          bg-background/80 backdrop-blur-2xl
          border-r border-white/8
          flex flex-col shadow-2xl shadow-black/40
          transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 shrink-0">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid place-items-center w-8 h-8 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6 scrollbar-hide">
          <div>
            <p className="px-2 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/40">
              Browse
            </p>
            <div className="space-y-0.5">
              <Link
                to="/products"
                className="group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200 shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  All Products
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
              </Link>

              <Link
                to="/products?sort=newest"
                className="group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform duration-200 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  New In
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
              </Link>
            </div>
          </div>

          <div className="h-px bg-border/40 mx-2" />

          {/* Categories */}
          <div>
            <p className="px-2 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/40">
              Categories
            </p>
            <div className="space-y-0.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.slug}
                    to={`/products?category=${c.slug}`}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                      {c.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/8 p-4">
          {user ? (
            <div className="space-y-1">
              <Link
                to="/wishlist"
                className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-rose-500/70 group-hover:text-rose-500 transition-colors shrink-0" />
                  Favourites
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
              </Link>

              {showBecomeSeller && (
                <Link
                  to="/seller/apply"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Become a Seller
                </Link>
              )}

              <div className="mt-3 pt-3 border-t border-white/8 px-1 flex items-center gap-3">
                <div className="grid place-items-center w-9 h-9 rounded-full bg-primary/15 text-primary text-sm font-bold uppercase shrink-0 ring-2 ring-primary/20">
                  {user.name?.[0] ?? "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              Sign In to Continue
            </Link>
          )}
        </div>
      </div>
    </>
  );
}