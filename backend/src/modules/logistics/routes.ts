import type { FastifyInstance } from "fastify";
import { LogisticsService } from "./service";
import { requireRole } from "../../middleware/auth";
import { idParam, logisticsUpsertBody, teamMemberBody } from "./schemas";

/**
 * Logistics surface (see PHASE2_DESIGN.md §5). Coarse gate = company role; the
 * recruiter is forced onto their OWN company's singleton logistics request inside
 * LogisticsService (row-level scoping never trusts a client-supplied id).
 */
export async function logisticsRoutes(app: FastifyInstance) {
  // The company's logistics request (or a null-id default) + team + schedule.
  app.get("/logistics", { preHandler: requireRole("company") }, async (req) =>
    LogisticsService.get(req.authUser!)
  );

  // Upsert the singleton logistics request.
  app.put("/logistics", { preHandler: requireRole("company") }, async (req) =>
    LogisticsService.upsert(req.authUser!, logisticsUpsertBody.parse(req.body))
  );

  // Add a visiting team member (creates an empty request if none exists yet).
  app.post("/logistics/team", { preHandler: requireRole("company") }, async (req, reply) => {
    const member = await LogisticsService.addTeamMember(
      req.authUser!,
      teamMemberBody.parse(req.body)
    );
    reply.code(201);
    return member;
  });

  // Remove a visiting team member (only one belonging to the recruiter's company).
  app.delete("/logistics/team/:id", { preHandler: requireRole("company") }, async (req) => {
    const { id } = idParam.parse(req.params);
    return LogisticsService.removeTeamMember(req.authUser!, id);
  });
}
