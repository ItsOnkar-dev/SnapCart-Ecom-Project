import crypto from "crypto";
import { Types } from "mongoose";
import { Product } from "../models/product.model";
import { Wishlist } from "../models/wishlist.model";
import { ApiError } from "../utils/ApiResponse";
import { addToCartService } from "./cart.service";

export const getOrCreateWishlist = async (userId: string | Types.ObjectId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
      shareEnabled: false,
    });
  }
  return wishlist;
};

export const getWishlistService = async (userId: string | Types.ObjectId) => {
  const wishlist = await getOrCreateWishlist(userId);
  await wishlist.populate(
    "items.product",
    "name images price discountPrice stock isActive",
  );
  return wishlist;
};

export const addToWishlistService = async (
  userId: string | Types.ObjectId,
  productId: string,
) => {
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!product.isActive) {
    throw new ApiError(400, "Product is currently unavailable");
  }

  const wishlist = await getOrCreateWishlist(userId);

  const isAlreadyInWishlist = wishlist.items.some(
    (item) => item.product.toString() === productId,
  );

  if (!isAlreadyInWishlist) {
    wishlist.items.push({
      product: new Types.ObjectId(productId) as any,
      addedAt: new Date(),
    });
    await wishlist.save();
  }

  await wishlist.populate(
    "items.product",
    "name images price discountPrice stock isActive",
  );
  return wishlist;
};

export const removeFromWishlistService = async (
  userId: string | Types.ObjectId,
  productId: string,
) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  wishlist.items = wishlist.items.filter(
    (item) => item.product.toString() !== productId,
  ) as any;

  await wishlist.save();
  await wishlist.populate(
    "items.product",
    "name images price discountPrice stock isActive",
  );
  return wishlist;
};

export const moveWishlistToCartService = async (
  userId: string | Types.ObjectId,
) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist || wishlist.items.length === 0) {
    throw new ApiError(400, "Wishlist is empty");
  }

  const userObj = { _id: userId };

  // Try adding each item to cart. If one fails (e.g. out of stock), log and proceed with others
  for (const item of wishlist.items) {
    try {
      await addToCartService(userObj, item.product.toString(), 1);
    } catch (error) {
      // Ignore individually failing items (e.g., out of stock or inactive) so that other items still migrate
      console.error(
        `Failed to move wishlist item ${item.product} to cart:`,
        error,
      );
    }
  }

  // Clear wishlist
  wishlist.items = [];
  await wishlist.save();

  return wishlist;
};

export const toggleWishlistShareService = async (
  userId: string | Types.ObjectId,
  shareEnabled: boolean,
) => {
  const wishlist = await getOrCreateWishlist(userId);

  wishlist.shareEnabled = shareEnabled;
  if (shareEnabled && !wishlist.shareId) {
    wishlist.shareId = crypto.randomBytes(16).toString("hex");
  } else if (!shareEnabled) {
    wishlist.set("shareId", undefined);
  }

  await wishlist.save();
  return wishlist;
};

export const getSharedWishlistService = async (shareId: string) => {
  const wishlist = await Wishlist.findOne({ shareId, shareEnabled: true });
  if (!wishlist) {
    throw new ApiError(404, "Public wishlist not found or sharing is disabled");
  }

  await wishlist.populate(
    "items.product",
    "name images price discountPrice stock isActive",
  );
  await wishlist.populate("user", "name");
  return wishlist;
};
