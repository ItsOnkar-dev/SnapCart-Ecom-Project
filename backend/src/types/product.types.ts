import { Document, Types } from "mongoose";

export type ProductCategory =
  | "All Products"
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "sports"
  | "books"
  | "gaming"
  | "new in";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discountPrice?: number; // sale price — optional
  category: ProductCategory;
  images: string[]; // array of image URLs
  stock: number; // how many units available
  seller: Types.ObjectId; // reference to the User who created this
  averageRating: number;
  totalReviews: number;
  isActive: boolean; // soft delete — don't actually remove from DB
  createdAt: Date;
  updatedAt: Date;
}
