import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { EventsService } from "./service";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00.000Z`)), "Invalid calendar date");

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time (HH:MM)");

const idParam = z.object({ id: z.string().uuid() });

const listQuery = z.object({
  from: dateStr.optional(),
  to: dateStr.optional(),
});

const createBody = z.object({
  type: z.enum(["ppt", "oa", "interview", "deadline", "result", "other"]),
  scope: z.enum(["global", "branch", "drive", "personal"]).default("personal"),
  title: z.string().min(1).max(200),
  detail: z.string().max(5000).nullish(),
  eventDate: dateStr,
  startTime: timeStr.nullish(),
  endTime: timeStr.nullish(),
  location: z.string().max(500).nullish(),
  driveId: z.string().uuid().nullish(),
  branchIds: z.array(z.string().uuid()).max(100).optional(),
});

const updateBody = createBody.omit({ scope: true }).partial();

export async function eventRoutes(app: FastifyInstance) {
  // Calendar feed, role-scoped inside the service (student: global/branch/
  // drive-they-touch/personal; company: global/own-company-drive/personal;
  // staff: everything). Cached per role+user+window.
  app.get("/events", { preHandler: requireAuth }, async (req) => {
    const q = listQuery.parse(req.query);
    return EventsService.list(req.authUser!, q.from, q.to);
  });

  // Create. Students/recruiters are forced to scope=personal (owner=self);
  // coordinator/admin/super_admin may also create global/branch/drive events.
  app.post("/events", { preHandler: requireAuth }, async (req) => {
    const body = createBody.parse(req.body);
    return EventsService.create(req.authUser!, body);
  });

  // Edit — owner (personal), creator or any coordinator/admin (org-scoped),
  // super_admin always. Enforced in the service.
  app.patch("/events/:id", { preHandler: requireAuth }, async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateBody.parse(req.body);
    return EventsService.update(req.authUser!, id, body);
  });

  // Delete — same authorisation as PATCH.
  app.delete("/events/:id", { preHandler: requireAuth }, async (req) => {
    const { id } = idParam.parse(req.params);
    return EventsService.remove(req.authUser!, id);
  });
}
