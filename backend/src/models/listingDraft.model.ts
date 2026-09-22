import mongoose, { Schema, Types } from "mongoose";

export interface IListingDraft {
  sellerId: Types.ObjectId;
  input: string;
  listing: {
    name: string;
    description: string;
    category: string;
    price: number;
    highlights: string[];
    shippingInfo: string;
  };
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const listingDraftSchema = new Schema<IListingDraft>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    input: { type: String, required: true, trim: true },
    listing: {
      name: { type: String, default: "" },
      description: { type: String, default: "" },
      category: { type: String, default: "" },
      price: { type: Number, default: 0 },
      highlights: { type: [String], default: [] },
      shippingInfo: { type: String, default: "" },
    },
    model: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ListingDraft = mongoose.model<IListingDraft>(
  "ListingDraft",
  listingDraftSchema,
);
