import { Router } from "express";
import { healthRouter } from "./health.routes";

/**
 * Root API router. Mount feature routers here as the platform grows
 * (e.g. students, companies, drives, applications).
 */
export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    name: "CCDC / TPC API",
    version: "0.1.0",
    docs: "See /api/health for service status.",
  });
});

apiRouter.use("/health", healthRouter);
