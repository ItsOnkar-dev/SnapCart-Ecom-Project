// src/pages/payment/PaymentSuccess.tsx
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { Link, useSearchParams } from "react-router";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="grid place-items-center h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Your payment was successful and your order is being processed.
          </p>
        </div>

        {/* Order details */}
        {(orderId || paymentId) && (
          <div className="rounded-2xl border border-border bg-card p-5 text-left space-y-3">
            {orderId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs text-foreground bg-muted/30 px-2 py-1 rounded">
                  {orderId}
                </span>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-xs text-foreground bg-muted/30 px-2 py-1 rounded">
                  {paymentId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-emerald-400 font-semibold text-xs">
                ● Paid & Confirmed
              </span>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="rounded-2xl border border-border bg-card/50 p-5 text-left">
          <p className="text-sm font-semibold text-foreground mb-3">
            What happens next?
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Your order has been confirmed and is being prepared for dispatch
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              You'll receive updates as your order ships
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Track your order anytime in your order history
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="h-12">
            <Link to="/orders">
              <Package className="size-4 mr-2" />
              View My Orders
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link to="/products">
              <ShoppingBag className="size-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
