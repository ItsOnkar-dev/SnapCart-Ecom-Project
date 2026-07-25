import { ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router";

import { Logo } from "@/components/home/Logo";

export default function CheckoutHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Left: Continue Shopping */}
        <Link
          to="/cart"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Continue Shopping</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Center: Logo */}
        <Logo className="shrink-0" />

        {/* Right: Secure Checkout badge */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3.5" />
          <span className="hidden sm:inline">Secure Checkout</span>
        </div>
      </div>
    </header>
  );
}
