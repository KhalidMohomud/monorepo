import type { UploadApiResponse } from "cloudinary";

import {
  cloudinary,
  isCloudinaryConfigured,
} from "../config/cloudinary.js";
import { AppError } from "../utils/app-error.js";

export const uploadMenuImage = async (buffer: Buffer): Promise<string> => {
  if (!isCloudinaryConfigured) {
    throw new AppError(
      503,
      "IMAGE_UPLOAD_NOT_CONFIGURED",
      "Menu image upload is not configured",
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        folder: "merhaba-order-desk/menu-items",
        resource_type: "image",
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result?.secure_url) {
          reject(
            new AppError(
              502,
              "IMAGE_UPLOAD_FAILED",
              "Image could not be uploaded",
            ),
          );
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
};
