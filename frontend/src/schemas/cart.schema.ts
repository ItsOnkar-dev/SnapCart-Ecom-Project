import { z } from "zod";
import { CART_ITEM_QUANTITY_MIN } from "@snapcart/validation";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.coerce
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(CART_ITEM_QUANTITY_MIN, "Quantity must be at least 1")
    .optional()
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(CART_ITEM_QUANTITY_MIN, "Quantity must be at least 1"),
});

export type AddToCartFormValues = z.infer<typeof addToCartSchema>;
export type UpdateCartItemFormValues = z.infer<typeof updateCartItemSchema>;
