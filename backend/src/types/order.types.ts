import { Document, Types } from "mongoose";

export type OrderStatus =
  | "pending" // just placed, waiting for seller to confirm
  | "confirmed" // seller confirmed the order
  | "shipped" // order is on the way
  | "delivered" // customer received it
  | "cancelled"; // order was cancelled

// Snapshot of each product at time of order
// We copy price/name here because seller might change product later
export interface IOrderItem {
  product: Types.ObjectId;
  name: string; // snapshot — copied from product at order time
  price: number; // snapshot — copied from product at order time
  quantity: number;
  image: string; // snapshot — first image of product
}

// Delivery address — copied from what customer enters at checkout
export interface IShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId; // who placed the order
  items: IOrderItem[]; // snapshot of cart items
  shippingAddress: IShippingAddress;
  totalPrice: number; // total at time of order
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
