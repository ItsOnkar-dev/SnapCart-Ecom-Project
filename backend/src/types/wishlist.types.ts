import { Types } from "mongoose";

export interface WishlistItem {
  product: Types.ObjectId;
  addedAt: Date;
}

export interface WishlistDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: WishlistItem[];
  shareId: string | null;
  shareEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
