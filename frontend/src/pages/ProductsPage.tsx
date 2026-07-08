import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import type { ProductCategory } from "@/types/product.types";

const PRICE_RANGES = [
  { label: "Under €50", min: 0, max: 50 },
  { label: "€50 - €150", min: 50, max: 150 },
  { label: "€150 - €500", min: 150, max: 500 },
  { label: "Over €500", min: 500, max: Infinity },
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
  const sortParam = searchParams.get("sort");
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const inStockParam = searchParams.get("inStock");
  const newArrivalsParam = searchParams.get("newArrivals");

  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(
    minPriceParam && maxPriceParam ? { min: Number(minPriceParam), max: Number(maxPriceParam) } : null
  );
  const [inStockOnly, setInStockOnly] = useState(inStockParam === "true");
  const [newArrivalsOnly, setNewArrivalsOnly] = useState(newArrivalsParam === "true");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Build query params for API
  const queryParams: any = {
    limit: 50,
  };

  if (categoryParam) {
    queryParams.category = categoryParam;
  }

  if (selectedPriceRange) {
    queryParams.minPrice = selectedPriceRange.min;
    queryParams.maxPrice = selectedPriceRange.max === Infinity ? undefined : selectedPriceRange.max;
  }

  if (sortParam) {
    queryParams.sort = sortParam;
  }

  if (inStockOnly) {
    queryParams.inStock = true;
  }

  if (newArrivalsOnly) {
    queryParams.sort = "newest";
  }

  const { data: productsData, isLoading, error } = useProducts(queryParams);
  const products = productsData?.products || [];

  const currentCategoryLabel = categoryParam
    ? categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)
    : "All Products";

  const handlePriceRangeChange = (range: { min: number; max: number } | null) => {
    setSelectedPriceRange(range);
    const newParams = new URLSearchParams(searchParams);
    if (range) {
      newParams.set("minPrice", range.min.toString());
      newParams.set("maxPrice", range.max === Infinity ? "" : range.max.toString());
    } else {
      newParams.delete("minPrice");
      newParams.delete("maxPrice");
    }
    setSearchParams(newParams);
  };

  const handleInStockChange = (value: boolean) => {
    setInStockOnly(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("inStock", "true");
    } else {
      newParams.delete("inStock");
    }
    setSearchParams(newParams);
  };

  const handleNewArrivalsChange = (value: boolean) => {
    setNewArrivalsOnly(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("newArrivals", "true");
    } else {
      newParams.delete("newArrivals");
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSelectedPriceRange(null);
    setInStockOnly(false);
    setNewArrivalsOnly(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("minPrice");
    newParams.delete("maxPrice");
    newParams.delete("inStock");
    newParams.delete("newArrivals");
    setSearchParams(newParams);
  };

  const hasActiveFilters = selectedPriceRange || inStockOnly || newArrivalsOnly;

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("sort", value);
    } else {
      newParams.delete("sort");
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{currentCategoryLabel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Shop {currentCategoryLabel.toLowerCase()}
            </h1>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Featured Dropdown */}
            <div className="relative">
              <select
                value={sortParam || ""}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-10 text-sm text-foreground cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {/* Filter Toggle Button */}
            <Button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              variant={isFiltersOpen ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Main Content - Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl border border-border bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to load products. Please try again.</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found.</p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    showNewBadge={newArrivalsOnly}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Filters Sidebar - Collapsible */}
          {isFiltersOpen && (
            <div className="w-72 shrink-0">
              <div className="sticky top-24 space-y-6">
                <div className="border border-border rounded-2xl p-6 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Filters</h3>
                    <Button
                      onClick={() => setIsFiltersOpen(false)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Price Filter */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Price</h4>
                    <div className="space-y-2">
                      {PRICE_RANGES.map((range) => (
                        <label
                          key={range.label}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="price"
                            checked={
                              selectedPriceRange?.min === range.min &&
                              selectedPriceRange?.max === range.max
                            }
                            onChange={() => handlePriceRangeChange(range)}
                            className="w-4 h-4 border-border text-primary focus:ring-primary focus:ring-offset-0 accent-primary"
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {range.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability Filter */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Availability</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="availability"
                          checked={inStockOnly}
                          onChange={() => handleInStockChange(true)}
                          className="w-4 h-4 border-border text-primary focus:ring-primary focus:ring-offset-0 accent-primary"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          In stock
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="availability"
                          checked={newArrivalsOnly}
                          onChange={() => handleNewArrivalsChange(true)}
                          className="w-4 h-4 border-border text-primary focus:ring-primary focus:ring-offset-0 accent-primary"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          New arrivals
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="availability"
                          checked={!inStockOnly && !newArrivalsOnly}
                          onChange={() => {
                            handleInStockChange(false);
                            handleNewArrivalsChange(false);
                          }}
                          className="w-4 h-4 border-border text-primary focus:ring-primary focus:ring-offset-0 accent-primary"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          All
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
