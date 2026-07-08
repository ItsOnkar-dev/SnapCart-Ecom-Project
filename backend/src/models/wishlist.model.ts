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
      unique: true, // one wishlist per user — enforced at DB level
    },
    items: [wishlistItemSchema],
    shareId: {
      type: String,
      default: null,
      unique: true,
      sparse: true, // allows many docs with shareId: null without unique conflict
    },
    shareEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Wishlist = model<WishlistDocument>("Wishlist", wishlistSchema);
