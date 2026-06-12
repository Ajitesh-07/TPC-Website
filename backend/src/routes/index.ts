import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.routes";
import { userRoutes } from "../modules/users/routes";
import { driveRoutes } from "../modules/drives/routes";

/**
 * Root API plugin (mounted under /api). Register feature modules here as the
 * platform grows (students, companies, applications, forms, ...).
 */
export async function apiRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    name: "CCDC / TPC API",
    version: "0.1.0",
    docs: "/docs",
  }));

  await app.register(healthRoutes);
  await app.register(userRoutes);
  await app.register(driveRoutes);
}
