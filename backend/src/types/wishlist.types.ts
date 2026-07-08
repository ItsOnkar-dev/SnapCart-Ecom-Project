// models/wishlist.model.ts
// One wishlist per user. shareId is null until the user explicitly
// enables sharing — generated on-demand, not on creation, so silent
// wishlists never have a guessable public URL sitting unused.

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
