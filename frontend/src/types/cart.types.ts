import type { Product } from "./product.types";

export interface CartItem {
  _id: string;
  product: Pick<Product, "_id" | "name" | "price" | "images" | "stock">;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}
