import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { cached } from "../../lib/cache";
import { requireAuth } from "../../middleware/auth";

/**
 * Reference data for form selects (branches/programs for eligibility pickers,
 * skills for tag inputs). Read-only, any authenticated user, cached hard —
 * this data changes only via admin master-data work.
 */
export async function metaRoutes(app: FastifyInstance) {
  app.get("/meta", { preHandler: requireAuth }, async () =>
    cached("meta", "all", 300, async () => {
      const [branches, programs, skills] = await Promise.all([
        prisma.branch.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
        prisma.program.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
        prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ]);
      return { branches, programs, skills };
    })
  );
}
