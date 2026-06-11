import type { ErrorRequestHandler } from "express";
import { isProduction } from "../config/env";

/** A small helper for throwing HTTP errors with a status code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Final error-handling middleware. Express 5 forwards rejected async handlers
 * here automatically, so route handlers can simply `throw`.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal Server Error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status >= 500 ? "Internal Server Error" : message,
    // Surface the real message + stack only outside production.
    ...(isProduction
      ? {}
      : { message, stack: err instanceof Error ? err.stack : undefined }),
  });
};
