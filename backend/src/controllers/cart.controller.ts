import { Request, Response } from "express";
import { Cart } from "../models/cart.model";
import {
  addToCartService,
  clearCartService,
  removeFromCartService,
  updateCartItemService,
} from "../services/cart.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getRouteParam = (value: string | string[] | undefined, _name: string) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    return value;
  }

  throw new ApiError(400, "Invalid request");
};

// POST /api/cart/add
// Add a product to cart — if already exists, increase quantity
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body;

  const cart = await addToCartService(req.user!, productId, quantity);

  res.status(200).json(new ApiResponse(200, "Product added to cart", cart));
});

// GET /api/cart
// Get current user's cart
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!._id }).populate(
    "items.product",
    "name images price discountPrice stock isActive",
  );

  // If no cart exists yet, return empty cart
  if (!cart) {
    res.status(200).json(
      new ApiResponse(200, "Cart is empty", {
        items: [],
        totalPrice: 0,
      }),
    );
    return;
  }

  res.status(200).json(new ApiResponse(200, "Cart fetched successfully", cart));
});

// PATCH /api/cart/:productId
// Update quantity of a specific item in cart
export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getRouteParam(req.params.productId, "product id");
    const { quantity } = req.body;

    const cart = await updateCartItemService(req.user!, productId, quantity);

    res
      .status(200)
      .json(new ApiResponse(200, "Cart updated successfully", cart));
  },
);

// DELETE /api/cart/:productId
// Remove a single item from cart
export const removeFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getRouteParam(req.params.productId, "product id");

    const cart = await removeFromCartService(req.user!, productId);

    res.status(200).json(new ApiResponse(200, "Item removed from cart", cart));
  },
);

// DELETE /api/cart
// Clear entire cart
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  await clearCartService(req.user!);

  res.status(200).json(new ApiResponse(200, "Cart cleared successfully"));
});
