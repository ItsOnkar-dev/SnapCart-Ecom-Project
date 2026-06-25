import mongoose, { Schema } from "mongoose";
import { IOrder } from "../types/order.types";

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true, // snapshot — saved at order time
    },
    price: {
      type: Number,
      required: true, // snapshot — saved at order time
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    image: {
      type: String,
      default: "", // first image of product at order time
    },
  },
  { _id: false }, // order items don't need their own _id
);

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
