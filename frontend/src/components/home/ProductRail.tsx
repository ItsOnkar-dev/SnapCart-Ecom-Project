// Reusable product section for the homepage.
// "New arrivals" and "Trending now" are both just this rail with different
// query params — data is LIVE from GET /api/products via useProducts.

import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import type { Product, ProductQueryParams } from "@/types/product.types";
import ProductCard from "./ProductCard";

interface ProductRailProps {
  title: string;
  subtitle: string;
  params: ProductQueryParams;
  viewAllHref: string;
  showNewBadge?: boolean;
}

export default function ProductRail({
  title,
  subtitle,
  params,
  viewAllHref,
  showNewBadge = false,
}: ProductRailProps) {
  const { data, isLoading, isError } = useProducts({ limit: 4, ...params });
  const products: Product[] = data?.products ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {isError ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Couldn&apos;t load products right now. Please try again shortly.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <Skeleton className="aspect-square rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-14" />
                  </div>
                </div>
              ))
            : products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showNewBadge={showNewBadge}
                />
              ))}

          {!isLoading && products.length === 0 && (
            <p className="col-span-full rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No products to show yet — check back soon.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
