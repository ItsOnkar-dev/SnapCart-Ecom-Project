import { Request, Response } from "express";
import { Product } from "../models/product.model";
import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "../services/product.service";
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

// POST /api/products
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await createProductService(req.user!, req.body, req.file);

    res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  },
);

// GET /api/products
export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, minPrice, maxPrice, search, page, limit, sort, inStock } =
      req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(50, Number(limit) || 10);
    const skip = (currentPage - 1) * pageLimit;

    const filter: Record<string, unknown> = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      };
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") {
      sortObj = { price: 1 };
    } else if (sort === "price_desc") {
      sortObj = { price: -1 };
    } else if (sort === "rating") {
      sortObj = { averageRating: -1, totalReviews: -1 };
    } else if (sort === "newest") {
      sortObj = { createdAt: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("seller", "name email")
        .sort(sortObj)
        .skip(skip)
        .limit(pageLimit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json(
      new ApiResponse(200, "Products fetched successfully", {
        products,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          totalPages: Math.ceil(total / pageLimit),
          hasNextPage: currentPage < Math.ceil(total / pageLimit),
          hasPrevPage: currentPage > 1,
        },
      }),
    );
  },
);

// GET /api/products/seller/mine
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

// GET /api/products/:id
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
      throw new ApiError(400, "Product status must be active or inactive");
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
