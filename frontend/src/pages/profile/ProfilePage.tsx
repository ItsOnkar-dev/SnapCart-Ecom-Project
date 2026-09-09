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
import { Spinner } from "@/components/ui/spinner";
import { useDeleteAccount, useLogout } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import type { CartItem } from "@/types/cart.types";
import type { Order } from "@/types/order.types";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Heart,
  KeyRound,
  LogOut,
  Package,
  ShieldCheck,
  ShieldEllipsis,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

function orderStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-emerald-500/10 text-emerald-400";
    case "shipped":
    case "in transit":
      return "bg-amber-500/10 text-amber-400";
    case "cancelled":
      return "bg-red-500/10 text-red-400";
    case "processing":
      return "bg-blue-500/10 text-blue-400";
    default:
      return "bg-primary/10 text-primary";
  }
}

function roleLabel(role: string) {
  switch (role) {
    case "demo_admin":
      return "Demo Admin";
    case "admin":
      return "Admin";
    case "seller":
      return "Seller";
    default:
      return "Customer";
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const { data: ordersData, isLoading: isOrdersLoading } = useOrders();
  const { data: wishlistData } = useWishlist();
  const { data: cartData } = useCart();

  const orders = ordersData?.orders ?? [];
  const wishlistCount = wishlistData?.items?.length ?? 0;
  const cartCount =
    cartData?.items?.reduce(
      (sum: number, item: CartItem) => sum + item.quantity,
      0,
    ) ?? 0;

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return null;

  const sellerStatus =
    user.role === "seller" ? "approved" : (user.sellerStatus ?? "none");

  const isAdmin = user.role === "admin" || user.role === "demo_admin";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 lg:py-20">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-primary">Your account</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {greeting()}, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track your orders, saved items, and account details.
          </p>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="relative px-6 py-8 sm:px-9 sm:py-10">
            {/* Decorative rings */}
            <div
              className="pointer-events-none absolute right-[-8%] top-[-90%]
                            h-[360px] w-[360px] rounded-full border border-primary/10"
            />
            <div
              className="pointer-events-none absolute right-[8%] top-[-70%]
                            h-[280px] w-[280px] rounded-full border border-primary/10"
            />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              {/* Avatar + identity */}
              <div className="flex items-center gap-5">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="size-20 shrink-0 rounded-[1.5rem] object-cover
                               border border-border shadow-sm"
                  />
                ) : (
                  <div
                    className="flex size-20 shrink-0 items-center justify-center
                                  rounded-[1.5rem] bg-primary/15 text-2xl font-bold
                                  text-primary shadow-inner"
                  >
                    {initials}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      {user.name}
                    </h2>
                    {user.isEmailVerified ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full
                                       bg-emerald-500/10 px-2.5 py-1
                                       text-xs font-medium text-emerald-400"
                      >
                        <BadgeCheck size={13} /> Email Verified
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full
                                       bg-amber-500/10 px-2.5 py-1
                                       text-xs font-medium text-amber-400"
                      >
                        <ShieldCheck size={13} /> Email unverified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.email}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserRound size={16} className="text-primary" />
                    Member since {formatDate(user.createdAt)}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {sellerStatus === "approved" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Sparkles size={12} /> Verified seller
                      </span>
                    )}
                    {sellerStatus === "pending" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                        <Store size={12} /> Seller application pending
                      </span>
                    )}
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <ShieldEllipsis size={12} /> {roleLabel(user.role)}{" "}
                        access
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatTile value={orders.length} label="Orders placed" />
                <StatTile value={wishlistCount} label="Saved items" />
                <StatTile
                  value={roleLabel(user.role)}
                  label="Account type"
                  highlight
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything you need, right where you need it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionCard
                icon={<Package />}
                title="Order history"
                detail={
                  orders.length > 0
                    ? `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`
                    : "No orders yet"
                }
                to="/orders"
              />
              <ActionCard
                icon={<Heart />}
                title="Wishlist"
                detail={
                  wishlistCount > 0
                    ? `${wishlistCount} item${wishlistCount !== 1 ? "s" : ""} saved`
                    : "No saved items yet"
                }
                to="/wishlist"
              />
              <ActionCard
                icon={<ShoppingBag />}
                title="Shopping bag"
                detail={
                  cartCount > 0
                    ? `${cartCount} item${cartCount !== 1 ? "s" : ""} in bag`
                    : "Your bag is empty"
                }
                to="/cart"
              />
              <ActionCard
                icon={<Store />}
                title="Browse products"
                detail="Discover something new"
                to="/products"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Account settings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your preferences.
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="divide-y divide-border">
              <SettingsRow
                icon={<UserRound size={17} />}
                title="Personal info"
                detail="Name and email"
                to="/account"
              />
              <SettingsRow
                icon={<KeyRound size={17} />}
                title="Change password"
                detail="Update login credentials"
                to="/change-password"
              />

              {(sellerStatus === "none" || sellerStatus === "rejected") && (
                <SettingsRow
                  icon={<Sparkles size={17} />}
                  title="Become a seller"
                  detail="Start selling on Snapcart"
                  to="/seller/apply"
                />
              )}
              {sellerStatus === "approved" && (
                <SettingsRow
                  icon={<Store size={17} />}
                  title="Seller dashboard"
                  detail="Manage your products"
                  to="/seller/dashboard"
                />
              )}

              {isAdmin && (
                <>
                  <SettingsRow
                    icon={<TrendingUp size={17} />}
                    title="Admin analytics"
                    detail="Revenue and performance"
                    to="/admin/analytics"
                  />
                  <SettingsRow
                    icon={<ShieldEllipsis size={17} />}
                    title="Admin dashboard"
                    detail="Manage users and orders"
                    to="/admin/dashboard"
                  />
                </>
              )}
            </div>
          </section>
        </div>

        <section
          id="orders"
          className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Recent orders
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest purchases in one place.
              </p>
            </div>
            <Link
              to="/orders"
              className="hidden items-center gap-1 text-sm font-semibold
                         text-primary hover:text-primary/80 transition-colors sm:flex"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {isOrdersLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-4 animate-pulse"
                >
                  <div className="size-12 rounded-2xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="size-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">
                No orders yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Your order history will appear here once you shop
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-1 text-sm font-semibold
                           text-primary hover:text-primary/80 transition-colors"
              >
                Start shopping <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.slice(0, 4).map((order: Order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="group flex w-full items-center gap-3 rounded-xl
                             px-2 py-4 transition hover:bg-muted/30 sm:gap-4"
                >
                  <div
                    className="flex size-12 shrink-0 items-center justify-center
                                  rounded-2xl bg-primary/10 text-xs font-bold text-primary"
                  >
                    {order._id.slice(-4).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px]
                                        font-bold capitalize
                                        ${orderStatusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{order._id.slice(-8).toUpperCase()}
                      <span className="mx-1 text-border">·</span>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatPrice(order.totalPrice)}
                  </p>

                  <ChevronRight
                    size={17}
                    className="shrink-0 text-muted-foreground/30 transition
                               group-hover:text-muted-foreground"
                  />
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/orders"
            className="mt-4 flex items-center gap-1 text-sm font-semibold
                       text-primary hover:text-primary/80 transition-colors sm:hidden"
          >
            View all <ArrowRight size={15} />
          </Link>
        </section>

        <footer
          className="mt-8 flex flex-col gap-4 border-t border-border
                           py-6 text-xs text-muted-foreground
                           sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <a
              href="mailto:support@snapcart.com"
              className="flex items-center gap-1.5 transition hover:text-foreground"
            >
              <CircleHelp size={14} /> Help &amp; support
            </a>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex items-center cursor-pointer gap-1.5 text-destructive
                         transition hover:text-destructive/80"
            >
              <Trash2 size={14} /> Delete account
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-1.5 font-semibold cursor-pointer
                       text-foreground/70 transition hover:text-foreground"
          >
            {isLoggingOut ? (
              <Spinner className="size-3.5" />
            ) : (
              <LogOut size={14} />
            )}
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </footer>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2">
                <LogOut className="size-5 text-foreground" />
              </div>
              <div>
                <AlertDialogTitle>Sign out of Snapcart?</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  You'll need to sign in again to access your account and order
                  history.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>
                  Permanently delete your account?
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  This removes your profile, saved items, and order history.
                  This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                setDeleteOpen(false);
                deleteAccount();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function StatTile({
  value,
  label,
  highlight = false,
}: {
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-4
      ${
        highlight
          ? "border-primary/20 bg-primary/10"
          : "border-border bg-background/50"
      }`}
    >
      <p
        className={`text-2xl font-semibold
        ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  detail,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-border
                 bg-card p-4 shadow-sm transition
                 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <span
        className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary
                       transition group-hover:bg-primary/20"
      >
        <span className="block [&>svg]:size-[19px]">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
      <ChevronRight
        size={17}
        className="shrink-0 text-muted-foreground/30 transition
                   group-hover:translate-x-0.5 group-hover:text-muted-foreground"
      />
    </Link>
  );
}

function SettingsRow({
  icon,
  title,
  detail,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex w-full items-center gap-3 py-4 transition hover:opacity-80"
    >
      <span
        className="rounded-xl bg-muted p-2.5 text-muted-foreground
                       transition group-hover:bg-primary/10 group-hover:text-primary"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {detail}
        </span>
      </span>
      <ChevronRight
        size={17}
        className="shrink-0 text-muted-foreground/30 transition
                   group-hover:translate-x-0.5 group-hover:text-muted-foreground"
      />
    </Link>
  );
}
