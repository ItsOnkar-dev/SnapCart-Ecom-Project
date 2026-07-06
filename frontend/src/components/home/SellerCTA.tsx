// "Start selling on Snapcart" banner — purple gradient CTA from the screenshot.

import { ArrowRight, Store } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export default function SellerCTA() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero p-8 md:p-10">
        <div className="absolute inset-0 bg-[var(--gradient-glow)]" />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary-glow">
              <Store className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Start selling on Snapcart
            </h2>
            <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
              Reach thousands of shoppers. List your products, manage orders,
              and grow your business — all from one dashboard.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 px-6">
            <Link to="/seller/apply">
              Become a seller
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
