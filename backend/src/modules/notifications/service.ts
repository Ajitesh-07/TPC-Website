import { Prisma, NotificationCategory } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFound } from "../../middleware/errorHandler";
import { pageArgs, paged, type PageQuery } from "../../lib/pagination";

/**
 * Notifications are strictly per-user: every query/mutation is scoped to
 * `userId = authUser.id`. Never accept a userId from the client. Not cached —
 * high write rate, and the `(userId, isRead, createdAt)` index keeps reads cheap.
 */

/** The six notification categories, in canonical order (used by GET /preferences). */
const ALL_CATEGORIES: NotificationCategory[] = [
  NotificationCategory.drive,
  NotificationCategory.status,
  NotificationCategory.deadline,
  NotificationCategory.schedule,
  NotificationCategory.profile,
  NotificationCategory.system,
];

export interface NotificationListQuery extends PageQuery {
  category?: NotificationCategory;
  unreadOnly?: boolean;
}

export interface PreferenceUpdateInput {
  category: NotificationCategory;
  enabled: boolean;
}

export const NotificationsService = {
  /** Own notifications, newest first, filterable by category / unread. */
  async list(userId: string, q: NotificationListQuery) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (q.category) where.category = q.category;
    if (q.unreadOnly) where.isRead = false;

    const [rows, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...pageArgs(q),
        select: {
          id: true,
          category: true,
          title: true,
          message: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return paged(rows, total, q);
  },

  /** Count of the user's own unread notifications. */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  },

  /** Mark one own notification read. 404 if it isn't the user's row. */
  async markRead(userId: string, id: string): Promise<{ id: string }> {
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (result.count === 0) throw NotFound("Notification not found");
    return { id };
  },

  /** Mark all the user's own unread notifications read. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  },

  /**
   * All six categories with their effective enabled flag — a stored
   * NotificationPreference if present, else the default (enabled = true).
   */
  async preferences(userId: string): Promise<{ category: NotificationCategory; enabled: boolean }[]> {
    const stored = await prisma.notificationPreference.findMany({
      where: { userId },
      select: { category: true, enabled: true },
    });
    const byCategory = new Map(stored.map((p) => [p.category, p.enabled]));
    return ALL_CATEGORIES.map((category) => ({
      category,
      enabled: byCategory.get(category) ?? true,
    }));
  },

  /** Upsert one category preference for the user. */
  async updatePreference(userId: string, input: PreferenceUpdateInput) {
    const pref = await prisma.notificationPreference.upsert({
      where: { userId_category: { userId, category: input.category } },
      create: { userId, category: input.category, enabled: input.enabled },
      update: { enabled: input.enabled },
      select: { category: true, enabled: true },
    });
    return pref;
  },
};
