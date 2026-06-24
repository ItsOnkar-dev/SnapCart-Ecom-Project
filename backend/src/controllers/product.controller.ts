import { Request, Response } from "express";
import { Product } from "../models/product.model";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// POST /api/products
// Only approved sellers can create products
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, price, discountPrice, category, images, stock } =
      req.body;

    // Step 1 — Validate required fields
    if (!name || !description || !price || !category || !stock) {
      throw new ApiError(
        400,
        "Name, description, price, category and stock are required",
      );
    }

    // Step 2 — Validate discount price is less than actual price
    if (discountPrice && discountPrice >= price) {
      throw new ApiError(
        400,
        "Discount price must be less than the original price",
      );
    }

    // Step 3 — Create product, attach seller from req.user
    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category,
      images: images || [],
      stock,
      seller: req.user!._id, // always taken from token — seller can't fake this
    });

    res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  },
);

// GET /api/products
// Public — anyone can browse products
export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    // Basic filters from query params
    // Example: /api/products?category=electronics&minPrice=100&maxPrice=5000
    const { category, minPrice, maxPrice, search } = req.query;

    // Build filter object dynamically based on what was sent
    const filter: Record<string, unknown> = { isActive: true }; // only show active products

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice && { $gte: Number(minPrice) }), // greater than or equal to minPrice
        ...(maxPrice && { $lte: Number(maxPrice) }), // less than or equal to maxPrice
      };
    }

    if (search) {
      // Search by product name — case insensitive
      filter.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter)
      .populate("seller", "name email") // replace seller ObjectId with their name + email
      .sort({ createdAt: -1 }); // newest first

    res
      .status(200)
      .json(new ApiResponse(200, "Products fetched successfully", products));
  },
);

// GET /api/products/:id
// Public — single product detail page
export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name email",
    );

    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Product fetched successfully", product));
  },
);

// PATCH /api/products/:id
// Seller can only edit THEIR OWN products
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found");
    }

    // Step 1 — Make sure this seller owns this product
    if (product.seller.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "You can only edit your own products");
    }

    // Step 2 — Validate discount price if being updated
    const newPrice = req.body.price ?? product.price;
    const newDiscountPrice = req.body.discountPrice ?? product.discountPrice;

    if (newDiscountPrice && newDiscountPrice >= newPrice) {
      throw new ApiError(
        400,
        "Discount price must be less than the original price",
      );
    }

    // Step 3 — Update only the fields that were sent
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // only update fields that were sent
      { new: true, runValidators: true }, // return updated doc + run schema validators
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, "Product updated successfully", updatedProduct),
      );
  },
);

// DELETE /api/products/:id
// Soft delete — sets isActive to false instead of removing from DB
// We never actually delete products — orders might reference them
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      throw new ApiError(404, "Product not found");
    }

    // Make sure this seller owns this product
    if (product.seller.toString() !== req.user!._id.toString()) {
      throw new ApiError(403, "You can only delete your own products");
    }

    // Soft delete — just flip isActive to false
    product.isActive = false;
    await product.save();

    res.status(200).json(new ApiResponse(200, "Product deleted successfully"));
  },
);
