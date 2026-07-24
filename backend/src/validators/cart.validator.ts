import { z } from "zod";
import { CART_ITEM_QUANTITY_MIN } from "@snapcart/validation";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(CART_ITEM_QUANTITY_MIN, "Quantity must be at least 1").optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(CART_ITEM_QUANTITY_MIN, "Quantity must be at least 1"),
});
