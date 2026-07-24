import { z } from "zod";
import {
  PRODUCT_NAME_MIN,
  PRODUCT_NAME_MAX,
  PRODUCT_DESC_MIN,
  PRODUCT_DESC_MAX,
  PRODUCT_CATEGORIES,
} from "@snapcart/validation";

export const createProductSchema = z
  .object({
    name: z
      .string({ error: "Product name is required" })
      .trim()
      .min(PRODUCT_NAME_MIN, `Product name must be at least ${PRODUCT_NAME_MIN} characters`)
      .max(PRODUCT_NAME_MAX, `Product name cannot exceed ${PRODUCT_NAME_MAX} characters`),
    description: z
      .string({ error: "Description is required" })
      .trim()
      .min(PRODUCT_DESC_MIN, `Description must be at least ${PRODUCT_DESC_MIN} characters`)
      .max(PRODUCT_DESC_MAX, `Description cannot exceed ${PRODUCT_DESC_MAX} characters`),
    price: z.coerce
      .number({ error: "Price is required" })
      .min(0, "Price cannot be negative"),
    discountPrice: z.coerce
      .number()
      .min(0, "Discount price cannot be negative")
      .optional(),
    category: z.enum(PRODUCT_CATEGORIES, { error: "Category is required" }),
    stock: z.coerce
      .number({ error: "Stock is required" })
      .min(0, "Stock cannot be negative"),
  })
  .refine((data) => !data.discountPrice || data.discountPrice < data.price, {
    message: "Discount price must be less than the original price",
    path: ["discountPrice"],
  });

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(PRODUCT_NAME_MIN, `Product name must be at least ${PRODUCT_NAME_MIN} characters`)
      .max(PRODUCT_NAME_MAX, `Product name cannot exceed ${PRODUCT_NAME_MAX} characters`)
      .optional(),

    description: z
      .string()
      .trim()
      .min(PRODUCT_DESC_MIN, `Description must be at least ${PRODUCT_DESC_MIN} characters`)
      .max(PRODUCT_DESC_MAX, `Description cannot exceed ${PRODUCT_DESC_MAX} characters`)
      .optional(),

    price: z.coerce
      .number({ error: "Price is required" })
      .min(0, "Price cannot be negative"),

    discountPrice: z.coerce
      .number()
      .min(0, "Discount price cannot be negative")
      .optional(),

    category: z
      .enum(PRODUCT_CATEGORIES)
      .optional(),

    stock: z.coerce
      .number({ error: "Stock is required" })
      .min(0, "Stock cannot be negative"),
  })
  .refine(
    (data) =>
      !data.discountPrice || !data.price || data.discountPrice < data.price,
    {
      message: "Discount price must be less than the original price",
      path: ["discountPrice"],
    },
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
