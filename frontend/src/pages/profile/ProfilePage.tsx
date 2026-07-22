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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/auth.store";
import type { Order } from "@/types/order.types";
import {
  BadgeCheck,
  Heart,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data, isLoading: isOrdersLoading } = useOrders();
  const orders = data?.orders ?? [];
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!user) {
    return null;
  }

  const sellerStatus =
    user.role === "seller" ? "approved" : (user.sellerStatus ?? "none");

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="mb-10 grid gap-6 border-b border-border pb-10 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-5">
            {/* AVATAR LOGIC ADDED HERE */}
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="size-16 shrink-0 rounded-2xl object-cover shadow-sm border border-border"
              />
            ) : (
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Account</p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {user.name}
              </h1>
              <p className="mt-2 text-muted-foreground">{user.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill
                  icon={user.isEmailVerified ? BadgeCheck : ShieldCheck}
                  label={
                    user.isEmailVerified
                      ? "Email verified"
                      : "Email not verified"
                  }
                  tone={user.isEmailVerified ? "success" : "warning"}
                />
                <StatusPill
                  icon={Store}
                  label={`Seller: ${sellerStatus}`}
                  tone={
                    sellerStatus === "approved"
                      ? "success"
                      : sellerStatus === "pending"
                        ? "warning"
                        : "muted"
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-3 lg:justify-end">
            {sellerStatus === "none" || sellerStatus === "rejected" ? (
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-none px-6"
              >
                <Link to="/seller/apply">Become a seller</Link>
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="h-12 rounded-none px-6 cursor-pointer"
              onClick={() => {
                setLogoutOpen(true);
              }}
            >
              {isLoggingOut ? (
                <Spinner className="mr-2 size-4" />
              ) : (
                <LogOut className="mr-2 size-4" />
              )}
              Sign out
            </Button>
          </div>
          <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-destructive/10 p-2">
                    <LogOut className="h-5 w-5 text-destructive" />
                  </div>

                  <div>
                    <AlertDialogTitle>
                      Sign out of your account?
                    </AlertDialogTitle>

                    <AlertDialogDescription className="mt-1">
                      Are you sure you want to sign out? You'll need to sign in
                      again to access your account.
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
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            to="/orders"
            icon={Package}
            label="Orders"
            value={`${orders.length}`}
          />
          <QuickLink
            to="/wishlist"
            icon={Heart}
            label="Wishlist"
            value="Saved items"
          />
          <QuickLink
            to="/cart"
            icon={ShoppingBag}
            label="Bag"
            value="Checkout"
          />
          <QuickLink
            to="/products"
            icon={Store}
            label="Shop"
            value="Continue shopping"
          />
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Order history
            </h2>
            <Button asChild variant="link" className="px-0 text-foreground">
              <Link to="/orders">View all</Link>
            </Button>
          </div>

          {isOrdersLoading ? (
            <div className="h-28 animate-pulse rounded-xl border border-border bg-card" />
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-muted-foreground">
              You have no orders yet.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order: Order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="grid gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/50 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Order #{order._id.slice(-8).toUpperCase()} -{" "}
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="mt-1 font-semibold capitalize text-foreground">
                      {order.status} - {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatPrice(order.totalPrice)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  tone: "success" | "warning" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-border bg-secondary text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${toneClass}`}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
  value,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
    >
      <Icon className="mb-5 size-5 text-primary-glow" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </Link>
  );
}
