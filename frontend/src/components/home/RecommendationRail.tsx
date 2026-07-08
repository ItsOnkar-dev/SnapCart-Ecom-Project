import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendations } from "@/hooks/useRecommendations";
import ProductCard from "./ProductCard";

interface RecommendationRailProps {
  title: string;
  subtitle: string;
  productId?: string;
  type?: "related" | "frequently-bought" | "personalized";
  limit?: number;
}

export default function RecommendationRail({
  title,
  subtitle,
  productId,
  type = "personalized",
  limit = 4,
}: RecommendationRailProps) {
  const { data: products, isLoading, isError } = useRecommendations({
    productId,
    type,
    limit,
  });

  if (isError) return null; // Silently hide if errors occur

  // Don't render if we successfully loaded but have no items
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-indigo-400 fill-indigo-400 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {isLoading
          ? Array.from({ length: limit }).map((_, i) => (
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
          : products?.map((product: any) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
      </div>
    </section>
  );
}
