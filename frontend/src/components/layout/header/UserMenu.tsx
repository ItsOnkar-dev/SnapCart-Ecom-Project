import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppearanceRow } from "@/components/ui/ThemeToggle";
import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import {
  ChevronDown,
  Heart,
  LogOut,
  Package,
  TrendingUp,
  User,
  UserCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [logoutOpen, setLogoutOpen] = useState(false);

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors outline-none focus:outline-none"
            aria-label="Account menu"
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
            <ChevronDown className="inline w-4 h-4 text-muted-foreground transition-transform" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 rounded-xl">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              className="flex items-center gap-3 cursor-pointer text-muted-foreground"
            >
              <UserCircle className="w-4 h-4" />
              My Profile
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              to="/orders"
              className="flex items-center gap-3 cursor-pointer text-muted-foreground"
            >
              <Package className="w-4 h-4" />
              Orders
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              to="/wishlist"
              className="flex items-center gap-3 cursor-pointer text-muted-foreground"
            >
              <Heart className="w-4 h-4" />
              Wishlist
            </Link>
          </DropdownMenuItem>

          {user.role === "seller" && (
            <DropdownMenuItem asChild>
              <Link
                to="/seller/dashboard"
                className="flex items-center gap-3 cursor-pointer text-muted-foreground"
              >
                <TrendingUp className="w-4 h-4" />
                Seller Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          {(user.role === "admin" || user.role === "demo_admin") && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/analytics"
                  className="flex items-center gap-3 cursor-pointer text-muted-foreground"
                >
                  <TrendingUp className="w-4 h-4" />
                  Admin Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-3 cursor-pointer text-muted-foreground"
                >
                  <UserCircle className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <div>
            <AppearanceRow variant="dropdown" />
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Log out of your account?</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  Are you sure you want to log out? You'll need to sign in again
                  to access your account.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isLoggingOut}
              onClick={() => {
                setLogoutOpen(false);
                logout();
              }}
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
