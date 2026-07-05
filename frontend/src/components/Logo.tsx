import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2", className)}
      aria-label="Snapcart Home"
    >
      <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
        <ShoppingCart
          className="h-5 w-5 text-primary-foreground"
          strokeWidth={2.2}
        />
      </span>
      {showText && (
        <h4 className="font-display text-xl font-bold tracking-tight text-foreground">
          Snap<span className="text-gradient">cart</span>
        </h4>
      )}
    </Link>
  );
};
