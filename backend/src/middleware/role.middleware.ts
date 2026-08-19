import type { RequestHandler } from "express";

import type { Role } from "../generated/prisma/enums.js";
import { AppError } from "../utils/app-error.js";

export const authorize = (...allowedRoles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(
        new AppError(
          401,
          "AUTHENTICATION_REQUIRED",
          "Authentication required",
        ),
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          "INSUFFICIENT_PERMISSIONS",
          "Insufficient permissions",
        ),
      );
      return;
    }

    next();
  };
