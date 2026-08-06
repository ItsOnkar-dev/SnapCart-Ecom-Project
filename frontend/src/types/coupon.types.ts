export type CouponDiscountType = "percentage" | "flat";

export interface Coupon {
  _id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrder: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CouponPayload {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrder: number;
  maxDiscount: number;
  usageLimit: number;
  expiresAt?: string;
  isActive?: boolean;
}
