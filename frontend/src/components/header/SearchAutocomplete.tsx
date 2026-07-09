// components/layout/SearchAutocomplete.tsx
// Debounced live search dropdown — wired to GET /products?search=...
// Matches the visual pattern of the old Lovable template's SearchAutocomplete,
// but pulls real data through useProducts() instead of Supabase.

import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product.types";

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchAutocomplete({
  placeholder = "Search products, brands and more...",
  className,
  onNavigate,
}: {
  placeholder?: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term.trim());

  // Only fires once 2+ characters typed — same threshold as the old design
  const { data, isFetching } = useProducts(
    debounced.length >= 2 ? { search: debounced, limit: 6 } : {},
  );
  const suggestions = debounced.length >= 2 ? (data?.products ?? []) : [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const goToProduct = (id: string) => {
    setTerm("");
    close();
    onNavigate?.();
    navigate(`/products/${id}`);
  };

  const goToSearch = () => {
    if (!term.trim()) return;
    const q = term.trim();
    setTerm("");
    close();
    onNavigate?.();
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToProduct(suggestions[activeIndex]._id);
      } else {
        goToSearch();
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  const showDropdown = open && debounced.length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch();
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          autoComplete="off"
          className="w-full h-10 pl-10 pr-9 rounded-full bg-secondary/60 border border-border
                     text-sm text-foreground placeholder:text-muted-foreground outline-none
                     focus:border-primary transition-colors"
        />
        {isFetching && debounced.length >= 2 && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </form>

      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {isFetching ? "Searching..." : `No matches for "${debounced}"`}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {suggestions.map((product: Product, i: number) => (
                <li key={product._id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToProduct(product._id);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      i === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <img
                      src={product.images?.[0] ?? "/placeholder-product.png"}
                      alt={product.name}
                      loading="lazy"
                      className="w-10 h-10 object-cover rounded shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-foreground truncate">
                        {product.name}
                      </span>
                      <span className="block text-xs text-muted-foreground capitalize">
                        {product.category}
                      </span>
                    </span>
                    <span className="text-sm text-foreground shrink-0">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    goToSearch();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-muted/60
                             border-t border-border transition-colors"
                >
                  See all results for "{debounced}"
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
