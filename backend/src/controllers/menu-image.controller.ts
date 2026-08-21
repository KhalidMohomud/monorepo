import type { RequestHandler } from "express";

import { uploadMenuImage } from "../services/menu-image.service.js";
import { AppError } from "../utils/app-error.js";

export const upload: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, "IMAGE_REQUIRED", "An image file is required");
    }

    const imageUrl = await uploadMenuImage(req.file.buffer);
    res.status(201).json({ data: { imageUrl } });
  } catch (error) {
    next(error);
  }
};
