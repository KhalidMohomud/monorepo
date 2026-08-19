import type { RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

const authenticationRequired = () =>
  new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication required");

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.get("authorization");

  if (!authorization) {
    next(authenticationRequired());
    return;
  }

  const bearerToken = /^Bearer +([^\s]+)$/i.exec(authorization);
  const token = bearerToken?.[1];

  if (!token) {
    next(authenticationRequired());
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(authenticationRequired());
  }
};
