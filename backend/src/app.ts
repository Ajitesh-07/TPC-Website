import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env, isProduction } from "./config/env";
import { apiRouter } from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

/** Builds and configures the Express application (no network side-effects). */
export function createApp(): Application {
  const app = express();

  // Security headers + CORS for the frontend origin(s).
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));

  // Request logging — concise in production, verbose in development.
  app.use(morgan(isProduction ? "combined" : "dev"));

  // Body parsing.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes.
  app.use("/api", apiRouter);

  // 404 + centralised error handling (must be registered last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
