import ProductCard from "@/components/home/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  useRecommendations,
  type RecommendationProduct,
} from "@/hooks/useRecommendations";
import { Sparkles } from "lucide-react";

interface RecommendedProductsProps {
  mode: "product" | "cart";
  productIds: string[];
  title?: string;
  limit?: number;
  className?: string;
  compact?: boolean; 
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CarouselSkeleton = ({ count }: { count: number }) =>
  Array.from({ length: count }).map((_, i) => (
    <CarouselItem
      key={i}
      className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
    >
      <div className="space-y-3">
        <div className="aspect-square rounded-2xl bg-muted/20 animate-pulse" />
        <div className="h-3 w-1/3 bg-muted/20 animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted/20 animate-pulse rounded" />
        <div className="h-4 w-1/4 bg-muted/20 animate-pulse rounded" />
      </div>
    </CarouselItem>
  ));

const CompactSkeleton = () =>
  Array.from({ length: 2 }).map((_, i) => (
    <div key={i} className="space-y-2">
      <div className="aspect-square rounded-2xl bg-muted/20 animate-pulse" />
      <div className="h-3 w-2/3 bg-muted/20 animate-pulse rounded" />
    </div>
  ));

// ─── Reason Label ─────────────────────────────────────────────────────────────

const ReasonLabel = ({ reason }: { reason: string }) => (
  <p className="text-[11px] text-muted-foreground px-1 line-clamp-1 flex items-center gap-1">
    <Sparkles size={9} className="shrink-0 text-primary" />
    <span>{reason}</span>
  </p>
);

const RecommendedProducts = ({
  mode,
  productIds,
  title = "You might also like",
  limit = 4,
  className = "",
  compact = false,
}: RecommendedProductsProps) => {
  const { data, isLoading } = useRecommendations({ mode, productIds, limit });

  // Empty + not loading → render nothing. No layout ghost, no empty section.
  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className={className}>
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="grid place-items-center h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-900/30">
          <Sparkles size={14} />
        </span>
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border/70 rounded-full px-2.5 py-0.5 font-semibold">
          AI picks
        </span>
      </div>

      {/* ── Compact layout (cart drawer) ── */}
      {compact ? (
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <CompactSkeleton />
          ) : (
            (data ?? []).slice(0, 2).map((product: RecommendationProduct) => (
              <div key={product._id} className="space-y-1">
                <ProductCard product={product} />
                {product.reason && <ReasonLabel reason={product.reason} />}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Full carousel layout (product detail page) ── */
        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {isLoading ? (
              <CarouselSkeleton count={limit} />
            ) : (
              (data ?? []).map((product: RecommendationProduct) => (
                <CarouselItem
                  key={product._id}
                  className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <div className="space-y-1.5">
                    <ProductCard product={product} />
                    {product.reason && <ReasonLabel reason={product.reason} />}
                  </div>
                </CarouselItem>
              ))
            )}
          </CarouselContent>
        </Carousel>
      )}
    </section>
  );
};

export default RecommendedProducts;
