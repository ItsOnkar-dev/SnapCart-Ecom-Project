import { api } from "@/lib/axios";

export const applyCouponApi = (code: string, subtotal: number) =>
  api.post("/coupons/apply", { code, subtotal });
