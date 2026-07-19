import type { Product } from "./product.types";

export interface WishlistItem {
  _id: string;
  /** product can be either a populated Product object or a raw product-ID string */
  product: Product | string;
}

export interface Wishlist {
  _id: string;
  user: string | { _id: string; name: string };
  items: WishlistItem[];
  shareEnabled?: boolean;
  shareId?: string;
}
