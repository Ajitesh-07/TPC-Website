import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RegistrationsService } from "./service";
import { requireRole } from "../../middleware/auth";
import { pageQuery } from "../../lib/pagination";

/**
 * Manage Companies / Registrations (see PHASE2_DESIGN.md §4). Coarse role gates
 * live here; row-level scoping (a student only ever acts as their own profile)
 * is enforced inside RegistrationsService.
 */

const registrationStatus = z.enum(["open", "closed", "pending"]);
const driveProcessType = z.enum(["internship", "six_month_fte", "six_month_ppo", "fte"]);

const idParam = z.object({ id: z.string().uuid() });

const listQuery = pageQuery.extend({
  search: z.string().trim().min(1).optional(),
  status: registrationStatus.optional(),
});

const createBody = z.object({
  companyName: z.string().trim().min(1).max(200),
  companyId: z.string().uuid().optional(),
  industry: z.string().trim().min(1).optional(),
  processType: driveProcessType.optional(),
  minCpi: z.number().min(0).max(10).optional(),
  registrationDeadline: z.coerce.date().optional(),
  eligibleBranchCodes: z.array(z.string().trim().min(1)).default([]),
});

const statusBody = z.object({ status: registrationStatus });

const respondBody = z.object({
  answers: z.record(z.string(), z.unknown()).optional(),
});

export async function registrationRoutes(app: FastifyInstance) {
  // ── Admin / super_admin ───────────────────────────────────────────────────

  // Manage Companies table: paginated, search (companyName), status filter.
  app.get("/registrations", { preHandler: requireRole("admin", "super_admin") }, async (req) =>
    RegistrationsService.list(listQuery.parse(req.query))
  );

  // Create a company registration for the active season + its eligible branches.
  app.post(
    "/registrations",
    { preHandler: requireRole("admin", "super_admin") },
    async (req, reply) => {
      const row = await RegistrationsService.create(createBody.parse(req.body), req.authUser!, req.ip);
      reply.code(201);
      return row;
    }
  );

  // Change status (open|closed|pending).
  app.patch(
    "/registrations/:id",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const { id } = idParam.parse(req.params);
      return RegistrationsService.setStatus(id, statusBody.parse(req.body), req.authUser!, req.ip);
    }
  );

  // Responses to a registration (table + CSV), newest first.
  app.get(
    "/registrations/:id/responses",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const { id } = idParam.parse(req.params);
      return RegistrationsService.responses(id);
    }
  );

  // ── Student ───────────────────────────────────────────────────────────────

  // Open registrations the student is eligible for, with hasResponded.
  app.get("/registrations/open", { preHandler: requireRole("student") }, async (req) =>
    RegistrationsService.openForStudent(req.authUser!)
  );

  // Submit a response (409 if already responded; 400 if closed/past deadline).
  app.post(
    "/registrations/:id/respond",
    { preHandler: requireRole("student") },
    async (req, reply) => {
      const { id } = idParam.parse(req.params);
      const result = await RegistrationsService.respond(id, respondBody.parse(req.body), req.authUser!);
      reply.code(201);
      return result;
    }
  );
}
