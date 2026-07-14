import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";

import ProductCard from "@/components/home/ProductCard";
import Pagination from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import type {
  Product,
  ProductCategory,
  ProductQueryParams,
  ProductSort,
} from "@/types/product.types";

const PRODUCTS_PER_PAGE = 8;

const CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: "Electronics", value: "electronics" },
  { label: "Fashion", value: "fashion" },
  { label: "Home", value: "home" },
  { label: "Beauty", value: "beauty" },
  { label: "Sports", value: "sports" },
  { label: "Gaming", value: "gaming" },
];

const PRICE_RANGES = [
  { label: "Under INR 50", min: 0, max: 50 },
  { label: "INR 50 – INR 150", min: 50, max: 150 },
  { label: "INR 150 – INR 500", min: 150, max: 500 },
  { label: "Over INR 500", min: 500, max: Infinity },
];

const SORT_OPTIONS = [
  { label: "Featured", value: "" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
];

// ─── Page skeleton ─────────────────────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-2xl border border-border bg-muted/20"
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Read all params from URL — single source of truth ─────────────────────
  const categoryParam = searchParams.get("category") as ProductCategory | null;
  const sortParam = searchParams.get("sort") as ProductSort | null;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock");
  const newArrivalsParam = searchParams.get("newArrivals");
  const isFiltersOpen = searchParams.get("filters") === "open";

  // Page comes from URL — zero client state for pagination
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  // Derived filter state directly from URL — no useState for filters
  const selectedPriceRange = minPriceParam
    ? {
        min: Number(minPriceParam),
        max: maxPriceParam ? Number(maxPriceParam) : Infinity,
      }
    : null;

  const inStockOnly = inStockParam === "true";
  const newArrivalsOnly = newArrivalsParam === "true";

  // ── Build query params for the API call ───────────────────────────────────
  const queryParams: ProductQueryParams = {
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
  };

  if (categoryParam) queryParams.category = categoryParam;
  if (selectedPriceRange) {
    queryParams.minPrice = selectedPriceRange.min;
    if (selectedPriceRange.max !== Infinity)
      queryParams.maxPrice = selectedPriceRange.max;
  }
  if (sortParam) queryParams.sort = sortParam;
  if (inStockOnly) queryParams.inStock = true;
  if (newArrivalsOnly) queryParams.sort = "newest";

  const { data, isLoading, error } = useProducts(queryParams);

  // Backend returns: { products, pagination: { total, page, totalPages, hasNextPage, hasPrevPage, limit } }
  const products = data?.products ?? [];
  const pagination = data?.pagination;

  // ── Scroll to top on page or filter change ────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [searchParams]);

  // ── URL param helpers ──────────────────────────────────────────────────────

  const setParam = (callback: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    callback(next);
    setSearchParams(next);
  };

  // Reset page to 1 whenever a filter changes — critical UX rule
  // If you're on page 3 and change category, page 3 may not exist anymore
  const setFilterParam = (callback: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    callback(next);
    next.set("page", "1"); // always reset page on filter change
    setSearchParams(next);
  };

  // ── Filter handlers — all reset page to 1 ─────────────────────────────────

  const handleCategoryChange = (category: ProductCategory | null) => {
    setFilterParam((p) => {
      if (category) p.set("category", category);
      else p.delete("category");
    });
  };

  const handlePriceRangeChange = (
    range: { min: number; max: number } | null,
  ) => {
    setFilterParam((p) => {
      if (range) {
        p.set("minPrice", range.min.toString());
        if (range.max === Infinity) p.delete("maxPrice");
        else p.set("maxPrice", range.max.toString());
      } else {
        p.delete("minPrice");
        p.delete("maxPrice");
      }
    });
  };

  const handleInStockChange = (value: boolean) => {
    setFilterParam((p) => {
      if (value) {
        p.set("inStock", "true");
        p.delete("newArrivals");
      } else p.delete("inStock");
    });
  };

  const handleNewArrivalsChange = (value: boolean) => {
    setFilterParam((p) => {
      if (value) {
        p.set("newArrivals", "true");
        p.delete("inStock");
      } else p.delete("newArrivals");
    });
  };

  const handleSortChange = (value: string) => {
    setFilterParam((p) => {
      if (value) p.set("sort", value);
      else p.delete("sort");
    });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    // Keep page at 1 (just delete it — defaults to 1)
    setSearchParams(next);
  };

  // ── Page change — only updates page param, keeps all filters ──────────────
  const handlePageChange = (page: number) => {
    setParam((p) => p.set("page", page.toString()));
    // scrollTo handled by the useEffect above
  };

  // ── Derived display values ─────────────────────────────────────────────────

  const hasActiveFilters =
    !!categoryParam || !!selectedPriceRange || inStockOnly || newArrivalsOnly;

  const currentCategoryLabel = categoryParam
    ? categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)
    : "All Products";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* ── Filter drawer backdrop ── */}
      {isFiltersOpen && (
        <button
          type="button"
          aria-label="Close filters"
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]"
          onClick={() => setFilterParam((p) => p.delete("filters"))}
        />
      )}

      {/* ── Filter drawer ── */}
      <aside
        className={`fixed right-0 top-0 z-[70] h-dvh w-full max-w-[350px] border-l border-sidebar-border bg-sidebar px-7 py-7 shadow-2xl transition-transform duration-300 ${
          isFiltersOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-sidebar-border pb-6">
            <h2 className="text-2xl font-bold text-foreground">Filters</h2>
            <Button
              onClick={() => setParam((p) => p.delete("filters"))}
              variant="ghost"
              size="icon"
              className="text-foreground"
              aria-label="Close filters"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Category */}
          <div className="border-b border-sidebar-border py-8">
            <h3 className="mb-5 text-base font-semibold text-foreground">
              Category
            </h3>
            <div className="space-y-4">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="flex cursor-pointer items-center gap-4 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={categoryParam === cat.value}
                    onChange={() => handleCategoryChange(cat.value)}
                    className="size-3 accent-indigo-400"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="border-b border-sidebar-border py-8">
            <h3 className="mb-5 text-base font-semibold text-foreground">
              Price
            </h3>
            <div className="space-y-4">
              {PRICE_RANGES.map((range) => (
                <label
                  key={range.label}
                  className="flex cursor-pointer items-center gap-4 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="price"
                    checked={
                      selectedPriceRange?.min === range.min &&
                      selectedPriceRange?.max === range.max
                    }
                    onChange={() => handlePriceRangeChange(range)}
                    className="size-3 accent-indigo-400"
                  />
                  {range.label}
                </label>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="border-b border-sidebar-border py-8">
            <h3 className="mb-5 text-base font-semibold text-foreground">
              Availability
            </h3>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-4 text-sm text-foreground">
                <input
                  type="radio"
                  name="availability"
                  checked={inStockOnly}
                  onChange={() => handleInStockChange(true)}
                  className="size-3 accent-indigo-400"
                />
                In stock
              </label>
              <label className="flex cursor-pointer items-center gap-4 text-sm text-foreground">
                <input
                  type="radio"
                  name="availability"
                  checked={newArrivalsOnly}
                  onChange={() => handleNewArrivalsChange(true)}
                  className="size-3 accent-indigo-400"
                />
                New arrivals
              </label>
            </div>
          </div>

          {/* Filter actions */}
          <div className="mt-auto grid gap-3 pt-6">
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="lg"
                className="h-12 rounded-md"
              >
                Clear Filters
              </Button>
            )}
            <Button
              onClick={() => setParam((p) => p.delete("filters"))}
              size="lg"
              className="h-12 rounded-md"
            >
              {pagination
                ? `View ${pagination.total} ${pagination.total === 1 ? "item" : "items"}`
                : "View results"}
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Breadcrumb ── */}
      <div className="border-b border-border/60 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight className="size-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {currentCategoryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* ── Page header + controls ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-foreground">
              {categoryParam ? currentCategoryLabel : "Shop all products"}
            </h1>
            {/* Shows total count — updates reactively as filters change */}
            {pagination && (
              <p className="text-sm text-muted-foreground">
                {pagination.total}{" "}
                {pagination.total === 1 ? "product" : "products"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortParam || ""}
                onChange={(e) => handleSortChange(e.target.value)}
                className="h-9 appearance-none rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Filters button */}
            <Button
              onClick={() => setParam((p) => p.set("filters", "open"))}
              variant={hasActiveFilters ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Filter className="size-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 size-2 rounded-full bg-primary-glow" />
              )}
            </Button>
          </div>
        </div>

        {/* ── Product grid ── */}
        {isLoading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Failed to load products. Please try again.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No products found.</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product: Product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showNewBadge={newArrivalsOnly}
                />
              ))}
            </div>

            {/* ── Pagination ── */}
            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                hasPrevPage={pagination.hasPrevPage}
                hasNextPage={pagination.hasNextPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
