import type { RequestHandler } from "express";
import multer from "multer";

import { AppError } from "../utils/app-error.js";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(
        new AppError(
          415,
          "UNSUPPORTED_IMAGE_TYPE",
          "Image must be a JPEG, PNG, or WebP file",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export const uploadMenuItemImage: RequestHandler = (req, res, next) => {
  imageUpload.single("image")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(
        new AppError(
          413,
          "IMAGE_TOO_LARGE",
          "Image must be no larger than 5 MB",
        ),
      );
      return;
    }

    next(error);
  });
};
