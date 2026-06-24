import { Request, Response } from "express";
import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/cart/add
// Add a product to cart — if already exists, increase quantity
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body;

  // Step 1 — Validate input
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Step 2 — Check product exists and is active
  const product = await Product.findById(productId);

  console.log("Received productId:", productId);
  console.log("Found product:", product);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!product.isActive) {
    throw new ApiError(400, "Product is currently unavailable");
  }

  // Step 3 — Check enough stock available
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  // Step 4 — Find existing cart or create a new one
  let cart = await Cart.findOne({ user: req.user!._id });

  if (!cart) {
    // First time adding to cart — create fresh cart
    cart = await Cart.create({
      user: req.user!._id,
      items: [],
      totalPrice: 0,
    });
  }

  // Step 5 — Check if this product is already in the cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (existingItemIndex > -1) {
    // Product already in cart — just increase quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;

    // Make sure new total quantity doesn't exceed stock
    if (newQuantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} units available in stock`);
    }

    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // New product — add it to cart
    // We snapshot the price now in case seller changes it later
    const priceToUse = product.discountPrice ?? product.price;

    cart.items.push({
      product: product._id,
      quantity,
      price: priceToUse,
    });
  }

  // Step 6 — Recalculate total and save
  cart.calculateTotal();
  await cart.save();

  // Step 7 — Return populated cart so frontend gets product details
  await cart.populate("items.product", "name images price discountPrice");

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
    const { productId } = req.params;
    const { quantity } = req.body;

    // Step 1 — Validate quantity
    if (!quantity || quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
    }

    // Step 2 — Find cart
    const cart = await Cart.findOne({ user: req.user!._id });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    // Step 3 — Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new ApiError(404, "Product not found in cart");
    }

    // Step 4 — Check stock
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      throw new ApiError(404, "Product no longer available");
    }

    if (quantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} units available in stock`);
    }

    // Step 5 — Update quantity, recalculate total, save
    cart.items[itemIndex].quantity = quantity;
    cart.calculateTotal();
    await cart.save();

    await cart.populate("items.product", "name images price discountPrice");

    res
      .status(200)
      .json(new ApiResponse(200, "Cart updated successfully", cart));
  },
);

// DELETE /api/cart/:productId
// Remove a single item from cart
export const removeFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user!._id });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    // Filter out the item to remove
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    ) as typeof cart.items;

    if (cart.items.length === initialLength) {
      throw new ApiError(404, "Product not found in cart");
    }

    cart.calculateTotal();
    await cart.save();

    res.status(200).json(new ApiResponse(200, "Item removed from cart", cart));
  },
);

// DELETE /api/cart
// Clear entire cart
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!._id });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = [] as typeof cart.items;
  cart.totalPrice = 0;
  await cart.save();

  res.status(200).json(new ApiResponse(200, "Cart cleared successfully"));
});
