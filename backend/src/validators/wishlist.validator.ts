import { z } from "zod";

export const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const toggleWishlistShareSchema = z.object({
  shareEnabled: z.boolean({
    error: "shareEnabled is required",
  }),
});

export const emailWishlistSchema = z.object({
  email: z.string().email("Invalid recipient email address"),
});
