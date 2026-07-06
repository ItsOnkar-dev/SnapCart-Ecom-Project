// Snapcart homepage — composed from small section components.
// Product rails ("New arrivals", "Trending now") are LIVE from
// GET /api/products via useProducts (see ProductRail).

import DepartmentGrid from "@/components/home/DepartmentGrid";
import Hero from "@/components/home/Hero";
import ProductRail from "@/components/home/ProductRail";
import SellerCTA from "@/components/home/SellerCTA";
import TrustBar from "@/components/home/TrustBar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <TrustBar />
      <DepartmentGrid />

      <ProductRail
        title="New arrivals"
        subtitle="Fresh picks just added"
        params={{ sort: "newest" }}
        viewAllHref="/products?sort=newest"
        showNewBadge
      />

      <SellerCTA />

      <ProductRail
        title="Trending now"
        subtitle="Popular products across Snapcart"
        params={{ sort: "rating" }}
        viewAllHref="/products?sort=rating"
      />
    </main>
  );
}
