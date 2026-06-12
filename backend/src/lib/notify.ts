import type { NotificationCategory } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Notification creation (Phase 2). Fire-and-forget — emitting a notification
 * must never block or fail the action that triggered it. Respects each user's
 * per-category preferences (a category is on unless explicitly disabled).
 */

interface NotifyInput {
  category: NotificationCategory;
  title: string;
  message?: string;
  link?: string;
}

async function disabledFor(userIds: string[], category: NotificationCategory): Promise<Set<string>> {
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: userIds }, category, enabled: false },
    select: { userId: true },
  });
  return new Set(prefs.map((p) => p.userId));
}

/** Notify a single user. */
export function notify(userId: string, input: NotifyInput): void {
  void (async () => {
    const off = await disabledFor([userId], input.category);
    if (off.has(userId)) return;
    await prisma.notification.create({
      data: {
        userId,
        category: input.category,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  })().catch((e) => console.error("[notify] failed:", e?.message ?? e));
}

/** Notify many users (bulk insert, preferences honoured). */
export function notifyMany(userIds: string[], input: NotifyInput): void {
  if (userIds.length === 0) return;
  void (async () => {
    const off = await disabledFor(userIds, input.category);
    const targets = userIds.filter((id) => !off.has(id));
    if (targets.length === 0) return;
    await prisma.notification.createMany({
      data: targets.map((userId) => ({
        userId,
        category: input.category,
        title: input.title,
        message: input.message,
        link: input.link,
      })),
    });
  })().catch((e) => console.error("[notifyMany] failed:", e?.message ?? e));
}

/** Notify every active user holding one of the given roles (e.g. all admins). */
export function notifyRole(roles: ("admin" | "super_admin" | "coordinator")[], input: NotifyInput): void {
  void (async () => {
    const users = await prisma.user.findMany({
      where: { role: { in: roles }, status: "active" },
      select: { id: true },
    });
    notifyMany(
      users.map((u) => u.id),
      input
    );
  })().catch((e) => console.error("[notifyRole] failed:", e?.message ?? e));
}
