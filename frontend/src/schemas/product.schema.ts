import { z } from "zod";

const productCategoryValues = [
  "All Products",
  "electronics",
  "fashion",
  "home",
  "beauty",
  "sports",
  "books",
  "gaming",
  "new in",
] as const;

const productCategorySchema = z.enum(productCategoryValues);

const optionalNumberSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().min(0, "Value cannot be negative").optional(),
);

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Product name must be at least 3 characters")
      .max(100, "Product name cannot exceed 100 characters"),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),
    price: z.coerce
      .number({ error: "Price is required" })
      .min(0, "Price cannot be negative"),
    discountPrice: optionalNumberSchema,
    stock: z.coerce
      .number({ error: "Stock is required" })
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative"),
    category: productCategorySchema,
    image: z.instanceof(File, { message: "Please upload an image" }),
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
    price: z.coerce.number().min(0, "Price cannot be negative").optional(),
    discountPrice: optionalNumberSchema,
    stock: z.coerce
      .number()
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative")
      .optional(),
    category: productCategorySchema.optional(),
    image: z.instanceof(File).optional(),
  })
  .refine(
    (data) =>
      !data.discountPrice || !data.price || data.discountPrice < data.price,
    {
      message: "Discount price must be less than the original price",
      path: ["discountPrice"],
    },
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
