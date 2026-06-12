import type { FastifyInstance } from "fastify";
import { DashboardsService } from "./service";
import { requireRole } from "../../middleware/auth";

/** Read-only dashboard aggregates, one endpoint per portal home page. */
export async function dashboardRoutes(app: FastifyInstance) {
  // Recruiter home — scoped to the recruiter's own company inside the service.
  app.get("/dashboards/company", { preHandler: requireRole("company") }, async (req) =>
    DashboardsService.company(req.authUser!)
  );

  // Coordinator home — scoped to assigned drives inside the service.
  app.get("/dashboards/coordinator", { preHandler: requireRole("coordinator") }, async (req) =>
    DashboardsService.coordinator(req.authUser!)
  );

  // Admin / super-admin home — institute-wide aggregates.
  app.get("/dashboards/admin", { preHandler: requireRole("admin", "super_admin") }, async () =>
    DashboardsService.admin()
  );
}
