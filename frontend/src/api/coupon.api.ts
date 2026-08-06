import { api } from "@/lib/axios";
import type { CouponPayload } from "@/types/coupon.types";

export const applyCouponApi = (code: string, subtotal: number) =>
  api.post("/coupons/apply", { code, subtotal });

export const getCouponsApi = () => api.get("/coupons");
export const createCouponApi = (payload: CouponPayload) =>
  api.post("/coupons", payload);
export const updateCouponApi = (id: string, payload: CouponPayload) =>
  api.patch(`/coupons/${id}`, payload);
export const deleteCouponApi = (id: string) => api.delete(`/coupons/${id}`);
