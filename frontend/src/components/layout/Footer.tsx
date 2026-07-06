// Global footer — Shop / Sell / Help columns + social, matching the screenshot.

import {  Globe, Mail } from "lucide-react";
import { Link } from "react-router";

import { Logo } from "@/components/Logo";

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Electronics", to: "/products?category=electronics" },
      { label: "Fashion", to: "/products?category=fashion" },
      { label: "Home", to: "/products?category=home" },
      { label: "Beauty", to: "/products?category=beauty" },
    ],
  },
  {
    heading: "Sell",
    links: [
      { label: "Become a seller", to: "/seller/apply" },
      { label: "Seller dashboard", to: "/seller/dashboard" },
      { label: "New In", to: "/products?sort=newest" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Shipping", to: "/shipping" },
      { label: "Returns", to: "/returns" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

const SOCIALS = [
  { icon: Mail, label: "Mail", href: "#" },
  { icon: Globe, label: "Globe", href: "#" },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-nav">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Snapcart is a modern marketplace where great products meet great
              sellers. Shop electronics, fashion, home, beauty and more — all in
              one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-foreground">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Snapcart. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
