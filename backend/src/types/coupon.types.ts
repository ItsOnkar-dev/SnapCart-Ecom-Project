import type { ICoupon } from "../models/coupon.model";

export interface ApplyCouponPayload {
  code: string;
  subtotal: number;
}

export interface ApplyCouponResult {
  coupon: Omit<ICoupon, "usedCount" | "usageLimit"> & {
    discount: number;
    finalTotal: number;
  };
}
