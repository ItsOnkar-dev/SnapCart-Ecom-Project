import { Request, Response } from "express";
import { Product } from "../models/product.model";
import {
    getFrequentlyBoughtTogether,
    getPersonalizedRecommendations,
    getRelatedProducts,
} from "../services/recommendation.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// GET /api/products/recommendations
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { productId, type, limit } = req.query;
  const itemLimit = Math.min(50, Number(limit) || 8);

  const prodId = typeof productId === "string" ? productId : "";
  const recType = typeof type === "string" ? type : "personalized";

  let products: any[] = [];

  try {
    if (recType === "related" && prodId) {
      products = await getRelatedProducts(prodId, itemLimit);
    } else if (recType === "frequently-bought" && prodId) {
      products = await getFrequentlyBoughtTogether(prodId, itemLimit);
    } else {
      // Personalized recommendations (fallback to top rated if not logged in)
      if (req.user) {
        products = await getPersonalizedRecommendations(req.user._id.toString(), itemLimit);
      } else {
        // Unauthenticated cold start - top rated products
        products = await Product.find({ isActive: true })
          .sort({ averageRating: -1, totalReviews: -1 })
          .limit(itemLimit);
      }
    }
  } catch (error) {
    console.error("Error in recommendations:", error);
    // Fallback to top rated products on any error
    products = await Product.find({ isActive: true })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(itemLimit);
  }

  res.status(200).json(new ApiResponse(200, "Recommendations fetched successfully", products));
});
