import { Document, Types } from "mongoose";

// A single item sitting in the cart
export interface ICartItem {
  product: Types.ObjectId; // reference to Product
  quantity: number;
  price: number; // snapshot of price at time of adding
  // in case seller changes price later
}

// The cart itself — one cart per user
export interface ICart extends Document {
  user: Types.ObjectId; // reference to User who owns this cart
  items: ICartItem[];
  totalPrice: number; // calculated total of all items
  createdAt: Date;
  updatedAt: Date;

  calculateTotal(): void;
}
