import { z } from "zod";
import {
  REVIEW_RATING_MIN,
  REVIEW_RATING_MAX,
  REVIEW_TITLE_MAX,
  REVIEW_COMMENT_MIN,
  REVIEW_COMMENT_MAX,
} from "../validation-constants";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(REVIEW_RATING_MIN, `Rating must be between ${REVIEW_RATING_MIN} and ${REVIEW_RATING_MAX}`)
    .max(REVIEW_RATING_MAX, `Rating must be between ${REVIEW_RATING_MIN} and ${REVIEW_RATING_MAX}`),
  title: z.string().trim().max(REVIEW_TITLE_MAX, `Title cannot exceed ${REVIEW_TITLE_MAX} characters`).optional(),
  comment: z
    .string()
    .trim()
    .min(REVIEW_COMMENT_MIN, `Comment must be at least ${REVIEW_COMMENT_MIN} characters`)
    .max(REVIEW_COMMENT_MAX, `Comment cannot exceed ${REVIEW_COMMENT_MAX} characters`),
});
