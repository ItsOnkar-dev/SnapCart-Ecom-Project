// src/hooks/usePayment.ts
import { createRazorpayOrderApi, verifyPaymentApi } from "@/api/payment.api";
import type { ShippingAddress } from "@/types/order.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Razorpay's checkout script adds `window.Razorpay` — this type covers it
// We declare a minimal interface matching the constructor + methods we actually use.
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  on(
    event: "payment.failed",
    handler: (response: { error: { description?: string } }) => void,
  ): void;
  open(): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

// ── Load Razorpay checkout script dynamically ─────────────────────────────────
// We load it on demand (not in index.html) so it doesn't slow down initial load
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Already loaded
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// usePayment
// Full flow handled inside:
//  1. Load Razorpay script
//  2. Call backend to create Razorpay order → get orderId + amount
//  3. Open Razorpay popup with those details
//  4. On payment success → send proof to backend for verification
//  5. On verified → invalidate cart + orders cache → navigate to success page

export function usePayment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: initiatePayment, isPending } = useMutation({
    mutationFn: async (shippingAddress: ShippingAddress) => {
      // Step 1 — load the Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error(
          "Failed to load Razorpay. Please check your internet connection.",
        );
      }

      // Step 2 — create Razorpay order from backend
      const res = await createRazorpayOrderApi(shippingAddress);
      const { orderId, amount, currency, keyId } = res.data.data;

      // Step 3 — open Razorpay popup
      // This is where the user sees the payment UI and enters card/UPI details
      return new Promise<{ orderId: string; paymentId: string }>(
        (resolve, reject) => {
          const options = {
            key: keyId, // Your rzp_test_xxx key
            amount, // In paise — Razorpay shows the correct amount
            currency,
            name: "SnapCart",
            description: "Order Payment",
            image: "/logo.png", // Optional — your logo in the popup

            order_id: orderId, // The Razorpay order ID from Step 2

            // Called when payment succeeds in the popup
            handler: (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              verifyPaymentApi({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
                .then((verifyRes) => {
                  resolve({
                    orderId: verifyRes.data.data.orderId,
                    paymentId: verifyRes.data.data.razorpayPaymentId,
                  });
                })
                .catch((err) => {
                  reject(err);
                });
            },

            // Pre-fill user details in the popup (optional but better UX)
            prefill: {
              name: shippingAddress.fullName,
              contact: shippingAddress.phone,
            },

            theme: {
              color: "#6366f1", // Indigo — matches your primary color
            },

            // Called when user closes the popup without paying
            modal: {
              ondismiss: () => {
                reject(new Error("Payment cancelled by user"));
              },
            },
          };

          const rzp = new window.Razorpay(options);

          // Called when payment fails (wrong card, insufficient funds, etc.)
          rzp.on(
            "payment.failed",
            (response: { error: { description?: string } }) => {
              reject(
                new Error(
                  response.error?.description ??
                    "Payment failed. Please try again.",
                ),
              );
            },
          );

          rzp.open(); // Open the popup
        },
      );
    },

    onSuccess: (data) => {
      // Invalidate cart so it shows empty after purchase
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Invalidate orders so the new order appears in order history
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast.success("Payment successful! Your order is confirmed.");

      // Navigate to success page with order details
      navigate(
        `/payment-success?orderId=${data.orderId}&paymentId=${data.paymentId}`,
      );
    },

    onError: (error: Error) => {
      if (error.message === "Payment cancelled by user") {
        toast.error("Payment cancelled.");
      } else {
        toast.error(error.message ?? "Payment failed. Please try again.");
      }
    },
  });

  return { initiatePayment, isPending };
}
