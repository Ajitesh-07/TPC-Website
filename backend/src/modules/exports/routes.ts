import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PlacementStatus } from "@prisma/client";
import { requireRole } from "../../middleware/auth";
import { ExportsService, csv } from "./service";

/**
 * Global Export surface (see PHASE2_DESIGN.md "Global Export"). super_admin only;
 * the data is unscoped by design. Every export is audited inside the service.
 */

const studentsExportQuery = z.object({
  branch: z.string().trim().min(1).max(50).optional(),
  placementStatus: z.nativeEnum(PlacementStatus).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

const companiesExportQuery = z.object({
  format: z.enum(["json", "csv"]).default("json"),
});

export async function exportRoutes(app: FastifyInstance) {
  // Students export — JSON rows or a text/csv download.
  app.get("/export/students", { preHandler: requireRole("super_admin") }, async (req, reply) => {
    const q = studentsExportQuery.parse(req.query);
    const { items, columns } = await ExportsService.students(q, req.authUser!, req.ip);

    if (q.format === "csv") {
      reply.header("content-type", "text/csv; charset=utf-8");
      reply.header("content-disposition", 'attachment; filename="students-export.csv"');
      return csv(items, columns);
    }
    return { items, total: items.length };
  });

  // Companies export — JSON rows or a text/csv download.
  app.get("/export/companies", { preHandler: requireRole("super_admin") }, async (req, reply) => {
    const q = companiesExportQuery.parse(req.query);
    const { items, columns } = await ExportsService.companies(q, req.authUser!, req.ip);

    if (q.format === "csv") {
      reply.header("content-type", "text/csv; charset=utf-8");
      reply.header("content-disposition", 'attachment; filename="companies-export.csv"');
      return csv(items, columns);
    }
    return { items, total: items.length };
  });
}
