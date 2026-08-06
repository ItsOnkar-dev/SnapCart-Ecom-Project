import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

// uploads a file Buffer directly to Cloudinary via stream —
// no temp file created, no cleanup needed, works on any filesystem
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = "snapcart/products",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};
