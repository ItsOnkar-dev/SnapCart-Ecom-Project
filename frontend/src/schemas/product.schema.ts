import { z } from "zod";
import {
  PRODUCT_NAME_MIN,
  PRODUCT_NAME_MAX,
  PRODUCT_DESC_MIN,
  PRODUCT_DESC_MAX,
  PRODUCT_CATEGORIES,
} from "../../../backend/src/validation-constants";

const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

const optionalNumberSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().min(0, "Value cannot be negative").optional(),
);

export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(PRODUCT_NAME_MIN, `Product name must be at least ${PRODUCT_NAME_MIN} characters`)
      .max(PRODUCT_NAME_MAX, `Product name cannot exceed ${PRODUCT_NAME_MAX} characters`),
    description: z
      .string()
      .trim()
      .min(PRODUCT_DESC_MIN, `Description must be at least ${PRODUCT_DESC_MIN} characters`)
      .max(PRODUCT_DESC_MAX, `Description cannot exceed ${PRODUCT_DESC_MAX} characters`),
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
      .min(PRODUCT_NAME_MIN, `Product name must be at least ${PRODUCT_NAME_MIN} characters`)
      .max(PRODUCT_NAME_MAX, `Product name cannot exceed ${PRODUCT_NAME_MAX} characters`)
      .optional(),
    description: z
      .string()
      .trim()
      .min(PRODUCT_DESC_MIN, `Description must be at least ${PRODUCT_DESC_MIN} characters`)
      .max(PRODUCT_DESC_MAX, `Description cannot exceed ${PRODUCT_DESC_MAX} characters`)
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
