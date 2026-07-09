// models/wishlist.model.ts
// One wishlist per user. shareId is null until the user explicitly
// enables sharing — generated on-demand, not on creation, so silent
// wishlists never have a guessable public URL sitting unused.

import { Schema, model } from "mongoose";
import { WishlistDocument, WishlistItem } from "../types/wishlist.types";

const wishlistItemSchema = new Schema<WishlistItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const wishlistSchema = new Schema<WishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
    shareId: {
      type: String,
      default: undefined,
    },
    shareEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

wishlistSchema.index(
  { shareId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

export const Wishlist = model<WishlistDocument>("Wishlist", wishlistSchema);
