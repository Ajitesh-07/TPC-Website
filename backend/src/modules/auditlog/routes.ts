import type { FastifyInstance } from "fastify";
import { AuditAction, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "../../middleware/auth";
import { pageQuery } from "../../lib/pagination";
import { AuditService } from "./service";

const listQuery = pageQuery.extend({
  type: z.nativeEnum(AuditAction).optional(),
  actorRole: z.nativeEnum(UserRole).optional(),
  search: z.string().trim().max(200).optional(),
});

/**
 * Audit Log surface (super_admin only) — read-only. The coarse role gate lives
 * here; there is no row-level scoping (a super_admin sees the entire trail).
 * Registered under the /api prefix centrally.
 */
export async function auditRoutes(app: FastifyInstance) {
  const superAdminOnly = requireRole("super_admin");

  // Paginated entries, newest first; type/actorRole/search filters.
  app.get("/audit", { preHandler: superAdminOnly }, async (req) =>
    AuditService.list(listQuery.parse(req.query))
  );

  // Headline counters for the audit dashboard.
  app.get("/audit/summary", { preHandler: superAdminOnly }, async () => AuditService.summary());
}
