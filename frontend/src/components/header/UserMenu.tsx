import {
  ChevronDown,
  Heart,
  LogOut,
  Moon,
  Package,
  Sun,
  TrendingUp,
  User,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();
  const [open, setOpen] = useState(false);
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.classList.contains("light"),
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle("light");
    setIsLight((v) => !v);
  };

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-1 p-2 text-nav-foreground hover:text-nav-hover transition-colors"
        aria-label="Account"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:inline text-sm">Sign In</span>
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="hidden lg:inline text-sm font-medium text-foreground">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`hidden lg:inline w-3.5 h-3.5 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full w-64 bg-popover rounded-xl shadow-lg border border-border
                     py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center">
            <div className="pl-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          <MenuLink to="/profile" icon={UserCircle}>
            My Profile
          </MenuLink>
          <MenuLink to="/orders" icon={Package}>
            Orders
          </MenuLink>
          <MenuLink to="/wishlist" icon={Heart}>
            Wishlist
          </MenuLink>
          {user.role === "seller" && (
            <>
              <MenuLink to="/seller/products" icon={TrendingUp}>
                Manage Products
              </MenuLink>
            </>
          )}
          {user.role === "admin" && (
            <>
              <MenuLink to="/admin/analytics" icon={TrendingUp}>
                Admin Analytics
              </MenuLink>
              <MenuLink to="/admin/sellers" icon={UserCircle}>
                Seller Applications
              </MenuLink>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground
                       hover:bg-secondary transition-colors"
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Sun className="w-4 h-4 text-muted-foreground" />
            )}
            {isLight ? "Dark Mode" : "Light Mode"}
          </button>

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive
                         hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground
                 hover:bg-secondary transition-colors"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      {children}
    </Link>
  );
}
