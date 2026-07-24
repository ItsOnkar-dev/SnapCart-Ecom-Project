import { Types } from "mongoose";
import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { ApiError } from "../utils/ApiResponse";

type CartUser = {
  _id: Types.ObjectId | string;
};

export const addToCartService = async (
  user: CartUser,
  productId: string,
  quantity: number = 1,
) => {
  if (!productId) {
    throw new ApiError(400, "Please select a product");
  }

  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!product.isActive) {
    throw new ApiError(400, "Product is currently unavailable");
  }

  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  let cart = await Cart.findOne({ user: user._id });

  if (!cart) {
    cart = await Cart.create({
      user: user._id,
      items: [],
      totalPrice: 0,
    });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (newQuantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} units available in stock`);
    }
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      price: product.discountPrice ?? product.price,
    });
  }

  cart.calculateTotal();
  await cart.save();
  await cart.populate("items.product", "name images price discountPrice");

  return cart;
};

export const updateCartItemService = async (
  user: CartUser,
  productId: string,
  quantity: number,
) => {
  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );
  if (itemIndex === -1) {
    throw new ApiError(404, "Product not found in cart");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product no longer available");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} units available in stock`);
  }

  cart.items[itemIndex].quantity = quantity;
  cart.calculateTotal();
  await cart.save();
  await cart.populate("items.product", "name images price discountPrice");

  return cart;
};

export const removeFromCartService = async (
  user: CartUser,
  productId: string,
) => {
  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  ) as typeof cart.items;

  if (cart.items.length === initialLength) {
    throw new ApiError(404, "Product not found in cart");
  }

  cart.calculateTotal();
  await cart.save();
  return cart;
};

export const clearCartService = async (user: CartUser) => {
  const cart = await Cart.findOne({ user: user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = [] as typeof cart.items;
  cart.totalPrice = 0;
  await cart.save();
  return cart;
};
