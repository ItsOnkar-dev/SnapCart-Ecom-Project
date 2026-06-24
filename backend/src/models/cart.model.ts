import mongoose, { Schema } from "mongoose";
import { ICart } from "../types/cart.types";

const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product", // links to Product model
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: false }, // cart items don't need their own _id
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user, always
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: [0, "Total price cannot be negative"],
    },
  },
  { timestamps: true },
);

// Helper method — recalculates totalPrice from all items
// Called every time cart is modified
cartSchema.methods.calculateTotal = function () {
  this.totalPrice = this.items.reduce(
    (total: number, item: { price: number; quantity: number }) =>
      total + item.price * item.quantity,
    0,
  );
};

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
