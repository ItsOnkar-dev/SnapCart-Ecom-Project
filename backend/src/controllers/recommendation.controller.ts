import { Request, Response } from "express";
import { Product } from "../models/product.model";
import {
  getCartRecommendations,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  getRelatedProducts,
} from "../services/recommendation.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/recommendations
export const getRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    const { mode, productIds: productIdsParam, limit: limitParam } = req.query;

    const limit = Math.min(16, Math.max(1, Number(limitParam) || 4));

    // Support both comma-separated string and repeated params: ?productIds=a,b or ?productIds=a&productIds=b
    const productIds: string[] = Array.isArray(productIdsParam)
      ? (productIdsParam as string[])
      : typeof productIdsParam === "string" && productIdsParam
        ? productIdsParam
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const recMode = mode === "cart" ? "cart" : "product";
    const userId = req.user?._id?.toString() ?? null;

    try {
      let products: any[] = [];

      if (recMode === "cart" && productIds.length > 0) {
        // Cart drawer — cross-sell based on everything in the cart
        products = await getCartRecommendations(productIds, userId, limit);
      } else if (recMode === "product" && productIds.length === 1) {
        // Product detail page — blend related + frequently-bought
        // Split limit: more weight to related (broader, better cold-start coverage)
        const relatedLimit = Math.ceil(limit * 0.6);
        const boughtLimit = Math.ceil(limit * 0.5); // Overlap intentional — dedupe below

        const [related, bought] = await Promise.all([
          getRelatedProducts(productIds[0], relatedLimit),
          getFrequentlyBoughtTogether(productIds[0], boughtLimit),
        ]);

        // Merge: bought-together first (stronger signal), then fill with related
        const seen = new Set<string>();
        const merged: any[] = [];

        for (const p of [...bought, ...related]) {
          const id = p._id?.toString();
          if (id && !seen.has(id)) {
            seen.add(id);
            merged.push(p);
            if (merged.length >= limit) break;
          }
        }

        products = merged;
      } else if (productIds.length > 1) {
        // Multiple product IDs but mode=product — treat as cart-aware
        products = await getCartRecommendations(productIds, userId, limit);
      } else if (userId) {
        // No seed products — personalized for logged-in user
        products = await getPersonalizedRecommendations(userId, [], limit);
      } else {
        // Anonymous, no seed — cold start top rated
        products = await Product.find({ isActive: true })
          .sort({ averageRating: -1, totalReviews: -1 })
          .limit(limit)
          .lean()
          .then((ps) => ps.map((p) => ({ ...p, reason: "Top rated pick" })));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Recommendations fetched successfully",
            products,
          ),
        );
    } catch (error) {
      console.error("[Recommendations] Controller error:", error);

      // Never fail silently — return top rated as the ultimate fallback
      const fallback = await Product.find({ isActive: true })
        .sort({ averageRating: -1, totalReviews: -1 })
        .limit(limit)
        .lean()
        .then((ps) => ps.map((p) => ({ ...p, reason: "Top rated pick" })));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Recommendations fetched successfully",
            fallback,
          ),
        );
    }
  },
);
