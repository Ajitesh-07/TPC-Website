import { Prisma, type AuditAction, type UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { pageArgs, paged, type PageQuery } from "../../lib/pagination";

/**
 * Read-only access to the audit trail (super_admin only — the route gate
 * enforces that). Rows are written elsewhere via `lib/audit`; this service never
 * writes. No row-level scoping: a super_admin sees the whole trail.
 */

export interface AuditListQuery extends PageQuery {
  type?: AuditAction;
  actorRole?: UserRole;
  search?: string;
}

/** Start of the current day in UTC (for "exports today"). */
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export const AuditService = {
  /** Paginated audit entries, newest first, with optional type/role/search filters. */
  async list(q: AuditListQuery) {
    const where: Prisma.AuditLogWhereInput = {};
    if (q.type) where.action = q.type;
    if (q.actorRole) where.actorRole = q.actorRole;
    if (q.search) {
      where.OR = [
        { targetLabel: { contains: q.search, mode: "insensitive" } },
        { details: { contains: q.search, mode: "insensitive" } },
        { actor: { fullName: { contains: q.search, mode: "insensitive" } } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { fullName: true } } },
        ...pageArgs(q),
      }),
      prisma.auditLog.count({ where }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      timestamp: r.createdAt,
      actorName: r.actor?.fullName ?? null,
      actorRole: r.actorRole,
      action: r.action,
      targetTable: r.targetTable,
      targetLabel: r.targetLabel,
      details: r.details,
      source: r.ipAddress,
    }));

    return paged(items, total, q);
  },

  /** Headline counters for the audit dashboard. */
  async summary() {
    const [total, exportsToday, roleChanges, policyActions] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { action: "export", createdAt: { gte: startOfTodayUtc() } },
      }),
      prisma.auditLog.count({ where: { action: "role_change" } }),
      prisma.auditLog.count({ where: { action: "policy" } }),
    ]);

    return { total, exportsToday, roleChanges, policyActions };
  },
};
