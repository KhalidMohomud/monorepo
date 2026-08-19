import type { RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../services/auth.service.js";
import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator.js";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);

    res.status(201).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        "AUTHENTICATION_REQUIRED",
        "Authentication required",
      );
    }

    const user = await getCurrentUser(req.user.id);

    res.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};
