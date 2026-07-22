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
        className="h-8 w-auto hidden [.light_&]:block"
      />
      {/* Dark Mode Icon: Shown by default, hidden when '.light' class is present on a parent */}
      <img
        src="/assets/SnapCartLogoDark.png"
        alt="Snapcart Icon"
        className="h-9 w-auto block [.light_&]:hidden"
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
            alt="Snapcart Logo"
            className="h-4.5 w-auto scale-[1.05] translate-y-[-0.5px] origin-left hidden [.light_&]:block"
          />
          <img
            src="/assets/SnapCartLogo.png"
            alt="Snapcart Logo"
            className="h-4.5 w-auto scale-[1.15] translate-y-[-0.5px] origin-left block [.light_&]:hidden"
          />
        </>
      )}
    </Link>
  );
};
