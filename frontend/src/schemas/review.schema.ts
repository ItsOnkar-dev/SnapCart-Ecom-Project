import { z } from "zod";

export const reviewFormSchema = z.object({
  rating: z.coerce
    .number({ error: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  title: z.string().trim().max(80, "Title cannot exceed 80 characters").optional(),
  comment: z
    .string()
    .trim()
    .min(10, "Comment must be at least 10 characters")
    .max(500, "Comment cannot exceed 500 characters"),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
