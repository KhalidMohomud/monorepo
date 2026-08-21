import type { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../config/cloudinary.js";
import { AppError } from "../utils/app-error.js";

export const uploadMenuImage = (buffer: Buffer): Promise<string> =>
  new Promise((resolve, reject) => {
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
