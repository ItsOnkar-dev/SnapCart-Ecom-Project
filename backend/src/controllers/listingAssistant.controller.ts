import { Request, Response } from "express";
import { z } from "zod";
import { ListingDraft } from "../models/listingDraft.model";
import {
  LISTING_CATEGORIES,
  generateProductListing,
} from "../services/listingAssistant.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const generateSchema = z.object({
  input: z
    .string({ error: "Product description is required" })
    .trim()
    .min(2, "Please describe your product — even a few words work")
    .max(500, "Description too long"),
  category: z.enum(LISTING_CATEGORIES).optional(),
});

// POST /api/seller/listing-assistant/generate
export const generateListing = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = generateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request",
      );
    }

    const { input, category } = parsed.data;

    const { listing, model } = await generateProductListing(input, category);

    await ListingDraft.create({
      sellerId: req.user!._id,
      input,
      listing,
      model,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, "AI Listing generated successfully", { listing }),
      );
  },
);

// GET /api/seller/listing-assistant/drafts
export const getSellerDrafts = asyncHandler(
  async (req: Request, res: Response) => {
    const drafts = await ListingDraft.find({ sellerId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res
      .status(200)
      .json(new ApiResponse(200, "Seller drafts fetched", { drafts }));
  },
);
