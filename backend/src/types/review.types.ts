import { Document, Types } from "mongoose";

export interface IReview extends Document {
  product: Types.ObjectId; // which product is being reviewed
  user: Types.ObjectId; // who wrote the review
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
