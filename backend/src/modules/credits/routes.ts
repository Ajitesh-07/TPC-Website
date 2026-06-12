import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../../middleware/auth";
import { pageQuery } from "../../lib/pagination";
import { CreditsService } from "./service";

const listQuery = pageQuery.extend({
  search: z.string().trim().max(100).optional(),
  band: z.enum(["healthy", "low", "critical"]).optional(),
  reason: z.string().trim().max(200).optional(),
});

const studentParams = z.object({ studentId: z.string().uuid() });

const adjustBody = z.object({
  delta: z
    .number()
    .int()
    .refine((v) => v !== 0, { message: "delta must be a non-zero integer" }),
  reason: z.string().trim().min(3).max(500),
  note: z.string().trim().min(1).max(500).optional(),
});

/** Admin credit ledger (registered under the /api prefix centrally). */
export async function creditRoutes(app: FastifyInstance) {
  const adminOnly = requireRole("admin", "super_admin");

  // Students with creditBalance + latest transaction; band/reason/search filters.
  app.get("/credits", { preHandler: adminOnly }, async (req) =>
    CreditsService.list(listQuery.parse(req.query))
  );

  // Full ledger for one student, newest first.
  app.get("/credits/:studentId/history", { preHandler: adminOnly }, async (req) => {
    const { studentId } = studentParams.parse(req.params);
    return CreditsService.history(studentId);
  });

  // Append a ledger row; the DB trigger maintains students.credit_balance.
  app.post("/credits/:studentId/adjust", { preHandler: adminOnly }, async (req) => {
    const { studentId } = studentParams.parse(req.params);
    const body = adjustBody.parse(req.body);
    return CreditsService.adjust(studentId, body, req.authUser!, req.ip);
  });
}
