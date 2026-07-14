// "Shop by department" — 6 category tiles linking into filtered /products.

import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const DEPARTMENTS = [
  {
    slug: "electronics",
    label: "Electronics",
    image:
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543129/aurora-headphones_clekm1.jpg",
  },
  {
    slug: "fashion",
    label: "Fashion",
    image:
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543166/stride-sneakers_i3hpoi.jpg",
  },
  {
    slug: "home",
    label: "Home",
    image:
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543158/lumen-lamp_h5w07i.jpg",
  },
  {
    slug: "beauty",
    label: "Beauty",
    image:
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543151/glow-skincare_d52efg.jpg",
  },
  {
    slug: "sports",
    label: "Sports",
    image:
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543161/nova-drone_nvl7n9.jpg",
  },
  {
    slug: "gaming",
    label: "Gaming",
    image:
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543115/apex-controller_iaofxs.jpg",
  },
];

export default function DepartmentGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Shop by department
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find exactly what you&apos;re looking for
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {DEPARTMENTS.map((dept) => (
          <Link
            key={dept.slug}
            to={`/products?category=${dept.slug}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
          >
            <span className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-secondary">
              <img
                src={dept.image || "/placeholder.svg"}
                alt={dept.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {dept.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
