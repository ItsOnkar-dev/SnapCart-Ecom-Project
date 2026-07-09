import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import type {
  Product,
  ProductCategory,
  ProductQueryParams,
  ProductSort,
} from "@/types/product.types";

const CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: "Electronics", value: "electronics" },
  { label: "Fashion", value: "fashion" },
  { label: "Home", value: "home" },
  { label: "Beauty", value: "beauty" },
  { label: "Sports", value: "sports" },
  { label: "Gaming", value: "gaming" },
];

const PRICE_RANGES = [
  { label: "Under EUR 50", min: 0, max: 50 },
  { label: "EUR 50 - EUR 150", min: 50, max: 150 },
  { label: "EUR 150 - EUR 500", min: 150, max: 500 },
  { label: "Over EUR 500", min: 500, max: Infinity },
];

const SORT_OPTIONS = [
  { label: "Featured", value: "" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") as ProductCategory | null;
  const sortParam = searchParams.get("sort") as ProductSort | null;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock");
  const newArrivalsParam = searchParams.get("newArrivals");

  const [selectedPriceRange, setSelectedPriceRange] = useState<{
    min: number;
    max: number;
  } | null>(
    minPriceParam
      ? {
          min: Number(minPriceParam),
          max: maxPriceParam ? Number(maxPriceParam) : Infinity,
        }
      : null,
  );
  const [inStockOnly, setInStockOnly] = useState(inStockParam === "true");
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(
    newArrivalsParam === "true",
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryParams: ProductQueryParams = {
    limit: 50,
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

  const { data: productsData, isLoading, error } = useProducts(queryParams);
  const products = productsData?.products || [];

  const currentCategoryLabel = categoryParam
    ? categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)
    : "All Products";

  const setParam = (callback: (params: URLSearchParams) => void) => {
    const newParams = new URLSearchParams(searchParams);
    callback(newParams);
    setSearchParams(newParams);
  };

  const handleCategoryChange = (category: ProductCategory | null) => {
    setParam((params) => {
      if (category) params.set("category", category);
      else params.delete("category");
    });
  };

  const handlePriceRangeChange = (
    range: { min: number; max: number } | null,
  ) => {
    setSelectedPriceRange(range);
    setParam((params) => {
      if (range) {
        params.set("minPrice", range.min.toString());
        if (range.max === Infinity) params.delete("maxPrice");
        else params.set("maxPrice", range.max.toString());
      } else {
        params.delete("minPrice");
        params.delete("maxPrice");
      }
    });
  };

  const handleInStockChange = (value: boolean) => {
    setInStockOnly(value);
    if (value) setNewArrivalsOnly(false);
    setParam((params) => {
      if (value) {
        params.set("inStock", "true");
        params.delete("newArrivals");
      } else {
        params.delete("inStock");
      }
    });
  };

  const handleNewArrivalsChange = (value: boolean) => {
    setNewArrivalsOnly(value);
    if (value) setInStockOnly(false);
    setParam((params) => {
      if (value) {
        params.set("newArrivals", "true");
        params.delete("inStock");
      } else {
        params.delete("newArrivals");
      }
    });
  };

  const clearFilters = () => {
    setSelectedPriceRange(null);
    setInStockOnly(false);
    setNewArrivalsOnly(false);
    setParam((params) => {
      params.delete("category");
      params.delete("minPrice");
      params.delete("maxPrice");
      params.delete("inStock");
      params.delete("newArrivals");
    });
  };

  // ── Scroll to top on every product navigation ──────────────────────────────
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [searchParams]);

  const hasActiveFilters =
    !!categoryParam || !!selectedPriceRange || inStockOnly || newArrivalsOnly;

  const handleSortChange = (value: string) => {
    setParam((params) => {
      if (value) params.set("sort", value);
      else params.delete("sort");
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {isFiltersOpen && (
        <button
          type="button"
          aria-label="Close filters"
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]"
          onClick={() => setIsFiltersOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[70] h-dvh w-full max-w-[350px] border-l border-sidebar-border bg-sidebar px-7 py-7 shadow-2xl transition-transform duration-300 ${
          isFiltersOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-sidebar-border pb-6">
            <h2 className="text-2xl font-bold text-foreground">Filters</h2>
            <Button
              onClick={() => setIsFiltersOpen(false)}
              variant="ghost"
              size="icon"
              className="text-foreground"
              aria-label="Close filters"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div className="border-b border-sidebar-border py-8">
            <h3 className="mb-5 text-base font-semibold text-foreground">
              Category
            </h3>
            <div className="space-y-4">
              {CATEGORIES.map((category) => (
                <label
                  key={category.value}
                  className="flex cursor-pointer items-center gap-4 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={categoryParam === category.value}
                    onChange={() => handleCategoryChange(category.value)}
                    className="size-3 accent-indigo-400"
                  />
                  {category.label}
                </label>
              ))}
            </div>
          </div>

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
              onClick={() => setIsFiltersOpen(false)}
              size="lg"
              className="h-12 rounded-md"
            >
              View {products.length} {products.length === 1 ? "item" : "items"}
            </Button>
          </div>
        </div>
      </aside>

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

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {categoryParam ? currentCategoryLabel : "Shop all products"}
            </h1>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortParam || ""}
                onChange={(event) => handleSortChange(event.target.value)}
                className="h-9 appearance-none rounded-lg border border-border bg-card px-4 pr-10 text-sm text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              onClick={() => setIsFiltersOpen(true)}
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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-2xl border border-border bg-muted"
              />
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: Product) => (
              <ProductCard
                key={product._id}
                product={product}
                showNewBadge={newArrivalsOnly}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
