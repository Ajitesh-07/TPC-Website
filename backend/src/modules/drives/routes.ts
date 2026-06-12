import type { FastifyInstance } from "fastify";
import { DrivesService } from "./service";
import { requireAuth, requireRole } from "../../middleware/auth";

export async function driveRoutes(app: FastifyInstance) {
  // Drives visible to the current user (scoped by role inside the service).
  app.get("/drives", { preHandler: requireAuth }, async (req) =>
    DrivesService.list(req.authUser!)
  );

  // A single drive (ownership checked in the service).
  app.get<{ Params: { id: string } }>(
    "/drives/:id",
    { preHandler: requireAuth },
    async (req) => DrivesService.get(req.params.id, req.authUser!)
  );

  // Applicant roster + statuses — recruiters (own company), coordinators, admins.
  app.get<{ Params: { id: string } }>(
    "/drives/:id/applicants",
    { preHandler: requireRole("company", "coordinator", "admin", "super_admin") },
    async (req) => DrivesService.applicants(req.params.id, req.authUser!)
  );
}
