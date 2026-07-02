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
  discountPrice?: number; 
  category: ProductCategory;
  images: string[]; 
  stock: number; 
  seller: Types.ObjectId;
  averageRating: number;
  totalReviews: number;
  isActive: boolean; 
  createdAt: Date;
  updatedAt: Date;
}
