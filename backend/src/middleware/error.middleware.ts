import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../config/env.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(500).json({
    error: {
      message: "Internal server error",
    },
  });
};
