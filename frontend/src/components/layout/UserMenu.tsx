// components/layout/UserMenu.tsx
// Dropdown under the user's name/avatar — Profile, Orders, Seller Dashboard
// (if applicable), Logout. Closes on outside click or Escape.

import { ChevronDown, LogOut, Package, Store, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700
                   hover:text-gray-900 transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:inline">Sign in</span>
      </Link>
    );
  }

  const isSellerOrAdmin = user.role === "seller" || user.role === "admin";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden lg:inline text-sm font-medium text-gray-700">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`hidden lg:inline w-3.5 h-3.5 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200
                     py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <MenuLink to="/profile" icon={User} onClick={() => setOpen(false)}>
            Profile
          </MenuLink>
          <MenuLink to="/orders" icon={Package} onClick={() => setOpen(false)}>
            Orders
          </MenuLink>

          {isSellerOrAdmin && (
            <MenuLink
              to="/seller/dashboard"
              icon={Store}
              onClick={() => setOpen(false)}
            >
              Seller Dashboard
            </MenuLink>
          )}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600
                         hover:bg-red-50 transition-colors"
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
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700
                 hover:bg-gray-50 transition-colors"
    >
      <Icon className="w-4 h-4 text-gray-400" />
      {children}
    </Link>
  );
}
