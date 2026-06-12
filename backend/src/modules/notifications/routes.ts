import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { NotificationCategory } from "@prisma/client";
import { requireAuth } from "../../middleware/auth";
import { pageQuery } from "../../lib/pagination";
import { NotificationsService } from "./service";

/**
 * Per-user notifications + preferences (see PHASE2_DESIGN.md "Notifications").
 * Every route is `requireAuth` only; row-level scoping to the authenticated
 * user happens in the service via `req.authUser!.id`. Not cached.
 */

const listQuery = pageQuery.extend({
  category: z.nativeEnum(NotificationCategory).optional(),
  unreadOnly: z.coerce.boolean().optional(),
});

const idParam = z.object({ id: z.string().uuid() });

const preferenceBody = z.object({
  category: z.nativeEnum(NotificationCategory),
  enabled: z.boolean(),
});

export async function notificationRoutes(app: FastifyInstance) {
  // Own notifications, newest first; category + unreadOnly filters, paginated.
  app.get("/notifications", { preHandler: requireAuth }, async (req) =>
    NotificationsService.list(req.authUser!.id, listQuery.parse(req.query))
  );

  // Count of own unread notifications.
  app.get("/notifications/unread-count", { preHandler: requireAuth }, async (req) =>
    NotificationsService.unreadCount(req.authUser!.id)
  );

  // Mark all own unread notifications read. (Static path before "/:id/read".)
  app.post("/notifications/read-all", { preHandler: requireAuth }, async (req) =>
    NotificationsService.markAllRead(req.authUser!.id)
  );

  // Effective preferences for all six categories (default enabled).
  app.get("/notifications/preferences", { preHandler: requireAuth }, async (req) =>
    NotificationsService.preferences(req.authUser!.id)
  );

  // Upsert one category preference.
  app.patch("/notifications/preferences", { preHandler: requireAuth }, async (req) =>
    NotificationsService.updatePreference(req.authUser!.id, preferenceBody.parse(req.body))
  );

  // Mark one own notification read; 404 if it isn't the user's.
  app.post("/notifications/:id/read", { preHandler: requireAuth }, async (req) => {
    const { id } = idParam.parse(req.params);
    return NotificationsService.markRead(req.authUser!.id, id);
  });
}
