import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

type HttpBodyError = Error & {
  status: number;
  type: string;
};

const isHttpBodyError = (error: unknown): error is HttpBodyError =>
  error instanceof Error &&
  "status" in error &&
  typeof error.status === "number" &&
  "type" in error &&
  typeof error.type === "string";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (
    isHttpBodyError(error) &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
      },
    });
    return;
  }

  if (
    isHttpBodyError(error) &&
    error.status === 413 &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body exceeds the 100kb limit",
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (env.NODE_ENV !== "test") {
    console.error("Unhandled application error", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
};
