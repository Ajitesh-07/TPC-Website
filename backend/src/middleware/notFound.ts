import type { Request, Response } from "express";

/** Catch-all for unmatched routes — returns a consistent 404 JSON shape. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
