import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { ApiError } from "../utils/ApiResponse";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

type SellerUser = {
  _id: Types.ObjectId | string;
  role: string;
  sellerStatus?: string;
};

type ProductCategory =
  | "All Products"
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "sports"
  | "books"
  | "gaming"
  | "new in";

type ProductInput = {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  category?: ProductCategory;
  stock: number;
};

type ProductUpdateInput = Partial<ProductInput> & {
  images?: string[];
};

type UploadedFile = {
  buffer: Buffer;
};

export const createProductService = async (
  user: SellerUser,
  payload: ProductInput,
  file?: UploadedFile,
) => {
  if (user.role !== "seller") {
    throw new ApiError(403, "Only approved sellers can create products");
  }

  if (user.sellerStatus !== "approved") {
    throw new ApiError(403, "Your seller account is not approved yet");
  }

  if (!file) {
    throw new ApiError(400, "Product image is required");
  }

  if (payload.discountPrice && payload.discountPrice >= payload.price) {
    throw new ApiError(
      400,
      "Discount price must be less than the original price",
    );
  }

  const uploadedImage = await uploadToCloudinary(file.buffer);

  return Product.create({
    ...payload,
    images: [uploadedImage.secure_url],
    stock: payload.stock,
    seller: user._id,
  });
};

export const updateProductService = async (
  user: SellerUser,
  productId: string,
  payload: ProductUpdateInput,
  file?: UploadedFile,
) => {
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  if (product.seller.toString() !== user._id.toString()) {
    throw new ApiError(403, "You can only edit your own products");
  }

  if (user.role !== "seller") {
    throw new ApiError(403, "Only approved sellers can update products");
  }

  if (user.sellerStatus !== "approved") {
    throw new ApiError(403, "Your seller account is not approved yet");
  }

  const newPrice = payload.price ?? product.price;
  const newDiscountPrice = payload.discountPrice ?? product.discountPrice;

  if (newDiscountPrice && newDiscountPrice >= newPrice) {
    throw new ApiError(
      400,
      "Discount price must be less than the original price",
    );
  }

  const updatePayload: Record<string, unknown> = { ...payload };

  if (file) {
    const uploadedImage = await uploadToCloudinary(file.buffer);
    updatePayload.images = [uploadedImage.secure_url];
  }

  return Product.findByIdAndUpdate(
    productId,
    { $set: updatePayload },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const deleteProductService = async (
  user: SellerUser,
  productId: string,
) => {
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  if (product.seller.toString() !== user._id.toString()) {
    throw new ApiError(403, "You can only delete your own products");
  }

  product.isActive = false;
  await product.save();

  return product;
};
