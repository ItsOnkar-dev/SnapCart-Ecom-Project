import type { PaginationResult } from "./api.types";
import type { Product } from "./product.types";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  product: string | Product;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refund_pending" | "refunded";
  paymentMethod: "razorpay" | "cod";
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: PaginationResult;
}
