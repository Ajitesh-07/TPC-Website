import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.routes";
import { userRoutes } from "../modules/users/routes";
import { studentSelfRoutes } from "../modules/students/self.routes";
import { studentsDirectoryRoutes } from "../modules/students/directory.routes";
import { driveRoutes } from "../modules/drives/routes";
import { applicationRoutes } from "../modules/applications/routes";
import { creditRoutes } from "../modules/credits/routes";
import { eventRoutes } from "../modules/events/routes";
import { dashboardRoutes } from "../modules/dashboards/routes";
import { adminUserRoutes } from "../modules/adminUsers/routes";
import { uploadRoutes } from "../modules/uploads/routes";
import { metaRoutes } from "../modules/meta/routes";
import { notificationRoutes } from "../modules/notifications/routes";
import { auditRoutes } from "../modules/auditlog/routes";
import { contactRoutes } from "../modules/contacts/routes";
import { registrationRoutes } from "../modules/registrations/routes";
import { logisticsRoutes } from "../modules/logistics/routes";
import { exportRoutes } from "../modules/exports/routes";

/**
 * Root API plugin (mounted under /api). One registration per feature module;
 * each plugin defines its paths without the /api prefix.
 */
export async function apiRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    name: "CCDC / TPC API",
    version: "0.1.0",
    docs: "/docs",
  }));

  await app.register(healthRoutes);
  await app.register(userRoutes);
  await app.register(studentSelfRoutes);
  await app.register(studentsDirectoryRoutes);
  await app.register(driveRoutes);
  await app.register(applicationRoutes);
  await app.register(creditRoutes);
  await app.register(eventRoutes);
  await app.register(dashboardRoutes);
  await app.register(adminUserRoutes);
  await app.register(uploadRoutes);
  await app.register(metaRoutes);

  // Phase 2
  await app.register(notificationRoutes);
  await app.register(auditRoutes);
  await app.register(contactRoutes);
  await app.register(registrationRoutes);
  await app.register(logisticsRoutes);
  await app.register(exportRoutes);
}
