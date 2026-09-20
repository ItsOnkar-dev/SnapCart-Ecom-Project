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
  highlights?: string[];
  shippingInfo?: string;
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
  files?: UploadedFile[] | UploadedFile,
) => {
  if (user.role !== "seller") {
    throw new ApiError(403, "Only approved sellers can create products");
  }

  if (user.sellerStatus !== "approved") {
    throw new ApiError(403, "Your seller account is not approved yet");
  }

  const fileArray = Array.isArray(files) ? files : files ? [files] : [];

  if (fileArray.length === 0) {
    throw new ApiError(400, "At least one product image is required");
  }

  if (payload.discountPrice && payload.discountPrice >= payload.price) {
    throw new ApiError(
      400,
      "Discount price must be less than the original price",
    );
  }

  const uploadPromises = fileArray.map((file) =>
    uploadToCloudinary(file.buffer),
  );
  const uploadResults = await Promise.all(uploadPromises);
  const imageUrls = uploadResults.map((result) => result.secure_url);

  return Product.create({
    ...payload,
    images: imageUrls,
    stock: payload.stock,
    seller: user._id,
  });
};

export const updateProductService = async (
  user: SellerUser,
  productId: string,
  payload: ProductUpdateInput,
  files?: UploadedFile[] | UploadedFile,
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

  const rawDiscount = payload.discountPrice;
  const newDiscountPrice =
    rawDiscount === undefined ||
    rawDiscount === null ||
    String(rawDiscount).trim() === ""
      ? null
      : Number(rawDiscount);

  if (newDiscountPrice !== null && newDiscountPrice >= newPrice) {
    throw new ApiError(
      400,
      "Discount price must be less than the original price",
    );
  }

  const updatePayload: Record<string, unknown> = {
    ...payload,
    discountPrice: newDiscountPrice,
  };

  const fileArray = Array.isArray(files) ? files : files ? [files] : [];

  if (fileArray.length > 0) {
    const uploadPromises = fileArray.map((file) =>
      uploadToCloudinary(file.buffer),
    );
    const uploadResults = await Promise.all(uploadPromises);
    updatePayload.images = uploadResults.map((result) => result.secure_url);
  }

  return Product.findByIdAndUpdate(
    productId,
    { $set: updatePayload },
    {
      returnDocument: "after",
      runValidators: true,
      context: "query",
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
