import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../../middleware/auth";
import { ContactsService } from "./service";

/** `YYYY-MM-DD` → a Date at UTC midnight (the column is Prisma @db.Date). */
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00.000Z`)), "Invalid calendar date")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const listQuery = z.object({
  search: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(120).optional(),
});

const companyParams = z.object({ companyId: z.string().uuid() });

const logBody = z.object({
  contactName: z.string().trim().min(1).max(200),
  designation: z.string().trim().min(1).max(200).optional(),
  channel: z.enum(["email", "call", "visit", "other"]),
  note: z.string().trim().min(1).max(2000).optional(),
  contactedOn: dateStr,
});

/**
 * Company Contacts surface (PHASE2_DESIGN.md §3). admin / super_admin only; there
 * is no per-company scoping, so the coarse role gate here is sufficient.
 * Registered under the /api prefix centrally.
 */
export async function contactRoutes(app: FastifyInstance) {
  const staffOnly = requireRole("admin", "super_admin");

  // Company directory with last-contacted, primary POC, and contact-log count.
  app.get("/contacts", { preHandler: staffOnly }, async (req) =>
    ContactsService.list(listQuery.parse(req.query))
  );

  // One company: its details, POCs, and full contact history (newest first).
  app.get("/contacts/:companyId", { preHandler: staffOnly }, async (req) => {
    const { companyId } = companyParams.parse(req.params);
    return ContactsService.detail(companyId);
  });

  // Log a contact attempt (recordedBy = the acting user). Audited as data_edit.
  app.post("/contacts/:companyId", { preHandler: staffOnly }, async (req, reply) => {
    const { companyId } = companyParams.parse(req.params);
    const body = logBody.parse(req.body);
    const entry = await ContactsService.log(companyId, body, req.authUser!, req.ip);
    reply.code(201);
    return entry;
  });
}
