import { Router } from "express";
import { env } from "../config/env";

export const healthRouter = Router();

/** Liveness/readiness probe. */
healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});
