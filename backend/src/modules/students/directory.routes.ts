import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../../middleware/auth";
import { pageQuery } from "../../lib/pagination";
import { StudentsDirectoryService } from "./directory.service";

const PLACEMENT_STATUSES = ["unplaced", "placed", "higher_studies", "opted_out", "debarred"] as const;
const CORRECTION_STATUSES = ["pending", "approved", "rejected"] as const;

const idParams = z.object({ id: z.string().uuid() });

const listQuery = pageQuery.extend({
  search: z.string().trim().min(1).max(200).optional(),
  branch: z.string().trim().min(1).max(50).optional(),
  placementStatus: z.enum(PLACEMENT_STATUSES).optional(),
});

const academicPatchBody = z
  .object({
    cpi: z.number().min(0).max(10).optional(),
    branchId: z.string().uuid().optional(),
    programId: z.string().uuid().optional(),
    batchYear: z.number().int().min(1900).max(2100).optional(),
    activeBacklogs: z.number().int().min(0).max(50).optional(),
    placementStatus: z.enum(PLACEMENT_STATUSES).optional(),
    btechVerified: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "At least one field is required" });

const blockBody = z
  .object({
    blocked: z.boolean(),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

const correctionsQuery = pageQuery.extend({
  status: z.enum(CORRECTION_STATUSES).optional(),
});

const reviewBody = z
  .object({
    approve: z.boolean(),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

/**
 * Staff directory over students + admin corrections queue.
 * Registered under the /api prefix by the central route index.
 */
export async function studentsDirectoryRoutes(app: FastifyInstance) {
  // Directory list — staff read access.
  app.get(
    "/students",
    { preHandler: requireRole("coordinator", "admin", "super_admin") },
    async (req) => {
      const q = listQuery.parse(req.query);
      return StudentsDirectoryService.list(q);
    }
  );

  // Full student profile.
  app.get(
    "/students/:id",
    { preHandler: requireRole("coordinator", "admin", "super_admin") },
    async (req) => {
      const { id } = idParams.parse(req.params);
      return StudentsDirectoryService.get(id);
    }
  );

  // Admin edit of academic fields.
  app.patch(
    "/students/:id",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const { id } = idParams.parse(req.params);
      const body = academicPatchBody.parse(req.body);
      return StudentsDirectoryService.update(id, body, req.authUser!, req.ip);
    }
  );

  // Block / unblock a student.
  app.post(
    "/students/:id/block",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const { id } = idParams.parse(req.params);
      const body = blockBody.parse(req.body);
      return StudentsDirectoryService.setBlocked(id, body.blocked, body.reason, req.authUser!, req.ip);
    }
  );

  // Admin review queue of data-correction requests.
  app.get(
    "/corrections",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const q = correctionsQuery.parse(req.query);
      return StudentsDirectoryService.listCorrections(q);
    }
  );

  // Approve / reject a correction request.
  app.post(
    "/corrections/:id/review",
    { preHandler: requireRole("admin", "super_admin") },
    async (req) => {
      const { id } = idParams.parse(req.params);
      const body = reviewBody.parse(req.body);
      return StudentsDirectoryService.reviewCorrection(id, body.approve, body.note, req.authUser!, req.ip);
    }
  );
}
