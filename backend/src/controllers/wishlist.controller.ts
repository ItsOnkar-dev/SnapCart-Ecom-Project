import { Request, Response } from "express";
import {
  addToWishlistService,
  getSharedWishlistService,
  getWishlistService,
  moveWishlistToCartService,
  removeFromWishlistService,
  toggleWishlistShareService,
} from "../services/wishlist.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { sendWishlistEmail } from "../utils/sendWishlistEmail";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  if (typeof value === "string") {
    return value;
  }
  throw new ApiError(400, `Invalid ${name} parameter`);
};

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await getWishlistService(req.user!._id);
  res
    .status(200)
    .json(new ApiResponse(200, "Wishlist fetched successfully", wishlist));
});

// POST /api/wishlist/add
export const addToWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.body;
    const wishlist = await addToWishlistService(req.user!._id, productId);
    res
      .status(200)
      .json(new ApiResponse(200, "Product added to wishlist", wishlist));
  },
);

// DELETE /api/wishlist/remove/:productId
export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getRouteParam(req.params.productId, "product id");
    const wishlist = await removeFromWishlistService(req.user!._id, productId);
    res
      .status(200)
      .json(new ApiResponse(200, "Product removed from wishlist", wishlist));
  },
);

// POST /api/wishlist/move-to-cart
export const moveWishlistToCart = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await moveWishlistToCartService(req.user!._id);
    const message =
      result.skipped.length > 0
        ? `Moved ${result.moved.length} item(s) to cart. ${result.skipped.length} could not be moved (kept in wishlist).`
        : "Wishlist items moved to cart successfully";
    res.status(200).json(new ApiResponse(200, message, result));
  },
);

// PATCH /api/wishlist/share
export const toggleWishlistShare = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareEnabled } = req.body;
    const wishlist = await toggleWishlistShareService(
      req.user!._id,
      shareEnabled,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `Wishlist sharing ${shareEnabled ? "enabled" : "disabled"}`,
          wishlist,
        ),
      );
  },
);

// GET /api/wishlist/share/:shareId
export const getSharedWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const shareId = getRouteParam(req.params.shareId, "share id");
    const wishlist = await getSharedWishlistService(shareId);
    res
      .status(200)
      .json(
        new ApiResponse(200, "Shared wishlist fetched successfully", wishlist),
      );
  },
);

// POST /api/wishlist/email
export const emailWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Recipient email is required");
    }

    const wishlist = await getWishlistService(req.user!._id);
    if (!wishlist.shareEnabled || !wishlist.shareId) {
      throw new ApiError(
        400,
        "Sharing must be enabled before you can email your wishlist",
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const wishlistLink = `${frontendUrl}/wishlist/share/${wishlist.shareId}`;

    await sendWishlistEmail(email, wishlistLink, req.user!.name);

    res.status(200).json(new ApiResponse(200, "Wishlist emailed successfully"));
  },
);
