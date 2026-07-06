// Three trust badges shown under the hero (free shipping / secure / trusted).

import { ShieldCheck, Store, Truck } from "lucide-react";

const ITEMS = [
  {
    icon: Truck,
    title: "Free shipping",
    desc: "On standard orders",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    desc: "Protected payments",
  },
  {
    icon: Store,
    title: "Trusted sellers",
    desc: "Admin-approved",
  },
];

export default function TrustBar() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6 md:pt-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary-glow">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
