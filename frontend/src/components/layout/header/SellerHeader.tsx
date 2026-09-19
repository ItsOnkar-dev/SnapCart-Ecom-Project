import { Logo } from "@/components/home/Logo";
import { Link } from "react-router";

const SellerHeader = () => {
  return (
    <header className="h-16 border-b border-border bg-background shrink-0">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link to="/">
          <Logo />
        </Link>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Exit application
        </Link>
      </div>
    </header>
  );
};

export default SellerHeader;
