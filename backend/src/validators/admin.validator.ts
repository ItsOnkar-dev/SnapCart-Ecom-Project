import { z } from "zod";

export const updateSellerStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
