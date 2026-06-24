import { Document, Types } from "mongoose";

export type ProductCategory =
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "sports"
  | "books"
  | "toys"
  | "food"
  | "other";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discountPrice?: number; // sale price — optional
  category: ProductCategory;
  images: string[]; // array of image URLs
  stock: number; // how many units available
  seller: Types.ObjectId; // reference to the User who created this
  isActive: boolean; // soft delete — don't actually remove from DB
  createdAt: Date;
  updatedAt: Date;
}
