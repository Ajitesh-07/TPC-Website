import type { FastifyInstance } from "fastify";
import { env } from "../config/env";

/** Liveness/readiness probe. */
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  }));
}
