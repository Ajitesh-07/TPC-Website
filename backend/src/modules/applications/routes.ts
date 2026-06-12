import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ApplicationsService, patchApplicationBody } from "./service";
import { requireAuth, requireRole } from "../../middleware/auth";

const idParams = z.object({ id: z.string().uuid() });

export async function applicationRoutes(app: FastifyInstance) {
  // Student applies to a drive. Tight per-route rate limit on top of the global
  // one (API_DESIGN.md "Rate limits"); all business guards live in the service.
  app.post(
    "/drives/:id/apply",
    {
      preHandler: requireRole("student"),
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    async (req) => {
      const { id } = idParams.parse(req.params);
      return ApplicationsService.apply(id, req.authUser!);
    }
  );

  // The student's own applications (drive + company + current stage).
  app.get("/applications/mine", { preHandler: requireRole("student") }, async (req) =>
    ApplicationsService.mine(req.authUser!)
  );

  // Move an application through the pipeline. Every role may attempt; the
  // service enforces the per-role authz matrix (student = withdraw-only, etc.).
  app.patch("/applications/:id", { preHandler: requireAuth }, async (req) => {
    const { id } = idParams.parse(req.params);
    const body = patchApplicationBody.parse(req.body);
    return ApplicationsService.patch(id, body, req.authUser!);
  });
}
