import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../../middleware/auth";
import { CORRECTION_FIELDS, StudentsSelfService } from "./self.service";

/**
 * Student self-service routes (API_DESIGN.md "Me / student self-service").
 * Registered under the /api prefix by the central router. All endpoints are
 * student-only; the service scopes every query to the authenticated user.
 */

// .strict(): any locked/unknown field (cpi, rollNo, batchYear, ...) → 400
// validation_error. Text fields accept null to clear the stored value.
const updateProfileBody = z
  .object({
    phone: z.string().trim().min(5).max(20).nullable().optional(),
    altEmail: z.string().trim().email().max(254).nullable().optional(),
    resumeKey: z.string().trim().min(1).max(500).nullable().optional(),
    linkedinUrl: z.string().trim().url().max(500).nullable().optional(),
    githubUrl: z.string().trim().url().max(500).nullable().optional(),
    preferredLocation: z.string().trim().min(1).max(120).nullable().optional(),
    skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  })
  .strict();

const correctionBody = z
  .object({
    fieldName: z.enum(CORRECTION_FIELDS),
    requestedValue: z.union([z.string().trim().min(1).max(500), z.number()]).transform(String),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict();

export async function studentSelfRoutes(app: FastifyInstance) {
  // Editable contact fields + skills replace-set. Bumps student:<id>.
  app.patch("/me/profile", { preHandler: requireRole("student") }, async (req) =>
    StudentsSelfService.updateProfile(req.authUser!, updateProfileBody.parse(req.body))
  );

  // Aggregate dashboard payload (cached 30s under student:<id>).
  app.get("/me/dashboard", { preHandler: requireRole("student") }, async (req) =>
    StudentsSelfService.dashboard(req.authUser!)
  );

  // Request a correction to a locked/academic field; reviewed by admins.
  app.post("/corrections", { preHandler: requireRole("student") }, async (req, reply) => {
    const row = await StudentsSelfService.createCorrection(
      req.authUser!,
      correctionBody.parse(req.body)
    );
    reply.code(201);
    return row;
  });

  // The caller's own correction requests, newest first.
  app.get("/corrections/mine", { preHandler: requireRole("student") }, async (req) =>
    StudentsSelfService.myCorrections(req.authUser!)
  );
}
