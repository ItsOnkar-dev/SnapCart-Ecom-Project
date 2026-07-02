import { Document, Types } from "mongoose";
import { IProduct } from "../types/product.types";

// A single item sitting in the cart
export interface ICartItem {
  product: Types.ObjectId; // reference to Product
  quantity: number;
  price: number;
}

export interface PopulatedCartItem {
  product: IProduct;
  quantity: number;
  price: number;
}
export interface ICart extends Document {
  user: Types.ObjectId; // reference to User who owns this cart
  items: ICartItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;

  calculateTotal(): void;
}
