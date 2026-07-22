import { cn } from "@/lib/utils";
// import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <Link
      to="/"
      className={cn("flex items-center", className)}
      aria-label="Snapcart Home"
    >
      {/* 
        Original gradient shape and ShoppingCart icon (Commented out):
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-primary shadow-glow">
          <ShoppingCart
            className="h-5 w-5 text-primary-foreground"
            strokeWidth={2.2}
          />
        </span>
      */}

      {/* --- Hexagonal "S" Icon --- */}
      {/* Light Mode Icon: Hidden by default (dark mode), shown when '.light' class is present on a parent */}
      <img
        src="/assets/SnapCartLogoLight.png"
        alt="Snapcart Icon"
        className="h-8 w-8 hidden [.light_&]:block"
      />
      <img
        src="/assets/SnapCartLogoDark.png"
        alt="Snapcart Icon"
        className="h-8 w-8 block [.light_&]:hidden"
      />

      {showText && (
        <>
          {/* 
            Original Text layout (Commented out):
            <h4 className="font-display text-xl font-bold tracking-tight text-foreground">
              Snap<span className="text-gradient">cart</span>
            </h4>
          */}

          {/* --- "SNAPCART" Text Logo --- */}
          <img
            src="/assets/SnapCartLogo1.png"
            alt="Snapcart"
            className="h-5 w-auto hidden [.light_&]:block"
          />
          <img
            src="/assets/SnapCartLogo.png"
            alt="Snapcart"
            className="h-5 w-auto block [.light_&]:hidden"
          />
        </>
      )}
    </Link>
  );
};
