import type { FastifyInstance } from "fastify";
import { DrivesService } from "./service";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  applicantsQuery,
  driveCreateBody,
  driveDecisionBody,
  driveListQuery,
  driveUpdateBody,
  idParam,
  stageParams,
  stageStatusBody,
} from "./schemas";

/**
 * Drives surface (see API_DESIGN.md "Drives"). Coarse role gates live here;
 * row-level ownership (own company / assigned drives / open-to-students) is
 * enforced inside DrivesService.
 */
export async function driveRoutes(app: FastifyInstance) {
  // Catalogue, role-scoped + filterable/sortable/paginated (cached 60s).
  app.get("/drives", { preHandler: requireAuth }, async (req) =>
    DrivesService.list(req.authUser!, driveListQuery.parse(req.query))
  );

  // Single drive with stages/documents/eligible branches+programs (cached 120s).
  app.get("/drives/:id", { preHandler: requireAuth }, async (req) => {
    const { id } = idParam.parse(req.params);
    return DrivesService.get(id, req.authUser!);
  });

  // Create a draft drive. Recruiters are forced onto their own company.
  app.post(
    "/drives",
    { preHandler: requireRole("company", "coordinator", "admin", "super_admin") },
    async (req, reply) => {
      const drive = await DrivesService.create(req.authUser!, driveCreateBody.parse(req.body));
      reply.code(201);
      return drive;
    }
  );

  // Partial update (owner recruiter while draft/pending, assigned coordinator, admin).
  app.patch(
    "/drives/:id",
    { preHandler: requireRole("company", "coordinator", "admin", "super_admin") },
    async (req) => {
      const { id } = idParam.parse(req.params);
      return DrivesService.update(id, req.authUser!, driveUpdateBody.parse(req.body));
    }
  );

  // draft → pending_approval.
  app.post(
    "/drives/:id/submit",
    { preHandler: requireRole("company", "coordinator", "admin", "super_admin") },
    async (req) => {
      const { id } = idParam.parse(req.params);
      return DrivesService.submit(id, req.authUser!);
    }
  );

  // Admin decision: approve → open (+ eligibility recompute), reject → cancelled.
  app.post(
    "/drives/:id/decision",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const { id } = idParam.parse(req.params);
      return DrivesService.decide(id, req.authUser!, driveDecisionBody.parse(req.body), req.ip);
    }
  );

  // Stage status change (assigned coordinator / admin).
  app.patch(
    "/drives/:id/stages/:stageId",
    { preHandler: requireRole("coordinator", "admin", "super_admin") },
    async (req) => {
      const { id, stageId } = stageParams.parse(req.params);
      const { status } = stageStatusBody.parse(req.body);
      return DrivesService.setStageStatus(id, stageId, status, req.authUser!);
    }
  );

  // Applicant roster — recruiters (own company), assigned coordinators, admins.
  app.get(
    "/drives/:id/applicants",
    { preHandler: requireRole("company", "coordinator", "admin", "super_admin") },
    async (req) => {
      const { id } = idParam.parse(req.params);
      return DrivesService.applicants(id, req.authUser!, applicantsQuery.parse(req.query));
    }
  );
}
