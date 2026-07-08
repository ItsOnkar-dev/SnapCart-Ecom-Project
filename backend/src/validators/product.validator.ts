import { z } from "zod";

export const createProductSchema = z
  .object({
    name: z
      .string({ error: "Product name is required" })
      .trim()
      .min(3, "Product name must be at least 3 characters")
      .max(100, "Product name cannot exceed 100 characters"),
    description: z
      .string({ error: "Description is required" })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),
    price: z.coerce
      .number({ error: "Price is required" })
      .min(0, "Price cannot be negative"),
    discountPrice: z.coerce
      .number()
      .min(0, "Discount price cannot be negative")
      .optional(),
    category: z.enum(
      [
        "All Products",
        "electronics",
        "fashion",
        "home",
        "beauty",
        "sports",
        "books",
        "gaming",
        "new in",
      ],
      { error: "Category is required" },
    ),
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
      .min(3, "Product name must be at least 3 characters")
      .max(100, "Product name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    price: z.coerce
      .number({ error: "Price is required" })
      .min(0, "Price cannot be negative"),

    discountPrice: z.coerce
      .number()
      .min(0, "Discount price cannot be negative")
      .optional(),

    category: z
      .enum([
        "All Products",
        "electronics",
        "fashion",
        "home",
        "beauty",
        "sports",
        "books",
        "gaming",
        "new in",
      ])
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
