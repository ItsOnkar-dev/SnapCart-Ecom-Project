import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  href: string;
  image: string;
  title: string;
  subtitle: string;
  className?: string;
}

function BentoCard({
  href,
  image,
  title,
  subtitle,
  className,
}: BentoCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card p-5",
        "transition-all duration-300 hover:border-primary/40",
        className,
      )}
    >
      <img
        src={image || "/placeholder.svg"}
        alt={title}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
      <div className="relative">
        <h3 className="text-lg font-bold text-foreground md:text-xl">
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors group-hover:text-primary-hover">
          Shop now
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-6 md:pt-10">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {/* promo card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-glow" />
          <div className="relative flex h-full flex-col justify-center">
            {/* Improved badge color contrast across themes */}
            <span className="inline-block w-fit text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full text-primary bg-primary/10 dark:text-primary-foreground dark:bg-primary/40">
              Welcome to Snapcart
            </span>
            <h1 className="mt-5 text-pretty text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
              Everything you love,{" "}
              <span className="text-gradient">delivered fast.</span>
            </h1>
            {/* Slightly darker text for improved readability on light gradient */}
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground/90 dark:text-muted-foreground">
              Shop thousands of products across electronics, fashion, home,
              beauty and more — from trusted sellers.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="px-5">
                <Link to="/products">
                  Start shopping
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {/* Dynamic border styling replacing the hardcoded hex value */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-5 border-border hover:bg-secondary/50 dark:border-primary/30"
              >
                <Link to="/seller/apply">Become a seller</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* category bento */}
        <div className="grid gap-4 lg:gap-5">
          <BentoCard
            href="/products?category=electronics"
            image="https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543129/aurora-headphones_clekm1.jpg"
            title="Electronics"
            subtitle="Audio, wearables & gadgets"
            className="min-h-48"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-5 min-h-48">
            <BentoCard
              href="/products?category=fashion"
              image="https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543166/stride-sneakers_i3hpoi.jpg"
              title="Fashion"
              subtitle="Footwear, bags & eyewear"
              className=""
            />
            <BentoCard
              href="/products?category=gaming"
              image="https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543115/apex-controller_iaofxs.jpg"
              title="Gaming"
              subtitle="Consoles & controllers"
              className=""
            />
          </div>
        </div>
      </div>
    </section>
  );
}
