import { Request, Response } from "express";
import { Product } from "../models/product.model";
import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "../services/product.service";
import { ApiError, ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getRouteParam = (value: string | string[] | undefined, name: string) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    return value;
  }

  throw new ApiError(400, `Invalid ${name} parameter`);
};

// POST /api/products
// Only approved sellers can create products
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, price, discountPrice, category, stock } =
      req.body;

    const product = await createProductService(
      req.user!,
      {
        name,
        description,
        price,
        discountPrice,
        category,
        stock,
      },
      req.file,
    );

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
    // Example: /api/products?category=electronics&minPrice=100&maxPrice=5000&page=1&limit=10&sort=price_asc
    const { category, minPrice, maxPrice, search, page, limit, sort, inStock } =
      req.query;

    // Pagination — default to page 1, 10 products per page
    const currentPage = Math.max(1, Number(page) || 1); // never go below page 1
    const pageLimit = Math.min(50, Number(limit) || 10); // max 50 per page — prevents abuse
    const skip = (currentPage - 1) * pageLimit; // how many to skip

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
      filter.$text = { $search: search as string };
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 }; // only show products with stock > 0
    }

    // Build sort object based on sort parameter
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest first
    if (sort === "price_asc") {
      sortObj = { price: 1 };
    } else if (sort === "price_desc") {
      sortObj = { price: -1 };
    } else if (sort === "rating") {
      sortObj = { averageRating: -1, totalReviews: -1 };
    } else if (sort === "newest") {
      sortObj = { createdAt: -1 };
    }

    // Run both queries in parallel — faster than running one after the other
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("seller", "name email") // replace seller ObjectId with their name + email
        .sort(sortObj)
        .skip(skip) // skip products from previous pages
        .limit(pageLimit), // only return this many products
      Product.countDocuments(filter), // total count matching the filter
    ]);

    res.status(200).json(
      new ApiResponse(200, "Products fetched successfully", {
        products,
        pagination: {
          total, // total products matching filter
          page: currentPage, // current page number
          limit: pageLimit, // products per page
          totalPages: Math.ceil(total / pageLimit), // how many pages exist
          hasNextPage: currentPage < Math.ceil(total / pageLimit), // is there a next page?
          hasPrevPage: currentPage > 1, // is there a previous page?
        },
      }),
    );
  },
);

// GET /api/products/seller/mine
// Seller dashboard â€” includes inactive products so sellers can understand what was removed.
export const getSellerProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const products = await Product.find({ seller: req.user!._id })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(
        new ApiResponse(200, "Seller products fetched successfully", products),
      );
  },
);

// GET /api/products/admin/all
// Admin catalog controls â€” all products, including inactive soft-deleted records.
export const getAdminProducts = asyncHandler(
  async (_req: Request, res: Response) => {
    const products = await Product.find({})
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(
        new ApiResponse(200, "Admin products fetched successfully", products),
      );
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
    const productId = getRouteParam(req.params.id, "product id");
    const updatedProduct = await updateProductService(
      req.user!,
      productId,
      req.body,
      req.file,
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
    const productId = getRouteParam(req.params.id, "product id");
    await deleteProductService(req.user!, productId);

    res.status(200).json(new ApiResponse(200, "Product deleted successfully"));
  },
);

// PATCH /api/products/admin/:id/status
// Admin can hide/restore products without taking ownership from sellers.
export const updateAdminProductStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const productId = getRouteParam(req.params.id, "product id");
    const { isActive } = req.body as { isActive?: boolean };

    if (typeof isActive !== "boolean") {
      throw new ApiError(400, "isActive must be true or false");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { isActive } },
      { new: true, runValidators: true },
    ).populate("seller", "name email");

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          isActive
            ? "Product restored successfully"
            : "Product hidden successfully",
          product,
        ),
      );
  },
);
