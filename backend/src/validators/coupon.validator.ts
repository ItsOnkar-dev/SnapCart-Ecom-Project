import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").max(20),
  discountType: z.enum(["percentage", "flat"]),
  discountValue: z.coerce.number().min(1, "Must be at least 1"),
  minimumOrder: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().min(0).optional(),
  expiresAt: z.string().optional(),
});
