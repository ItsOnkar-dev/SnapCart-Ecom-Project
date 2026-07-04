import { Types } from "mongoose";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiResponse";

type SellerUser = {
  _id: Types.ObjectId | string;
  role: string;
  sellerStatus?: string;
  isEmailVerified?: boolean;
  email: string;
  name: string;
};

export const applyForSellerService = async (user: SellerUser) => {
  if (user.role !== "customer") {
    throw new ApiError(400, "Only customers can apply to become a seller");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email before applying to become a seller",
    );
  }

  if (user.sellerStatus === "pending") {
    throw new ApiError(400, "Your application is already under review");
  }

  if (user.sellerStatus === "approved") {
    throw new ApiError(400, "You are already an approved seller");
  }

  await User.findByIdAndUpdate(user._id, {
    sellerStatus: "pending",
  });

  return { success: true };
};

export const updateSellerStatusService = async (
  targetUserId: string,
  status: "approved" | "rejected",
) => {
  const user = await User.findById(targetUserId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.sellerStatus !== "pending") {
    throw new ApiError(400, "This user does not have a pending application");
  }

  user.sellerStatus = status;
  if (status === "approved") {
    user.role = "seller";
  }

  await user.save({ validateBeforeSave: false });

  return user;
};
