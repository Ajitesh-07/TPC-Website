import type { AuditAction } from "@prisma/client";
import { prisma } from "./prisma";
import type { AuthUser } from "../middleware/auth";

interface AuditOpts {
  targetTable?: string;
  targetId?: string;
  targetLabel?: string;
  details?: string;
  ip?: string;
}

/**
 * Append to the read-only audit trail. Fire-and-forget by design: auditing must
 * never block or fail the user's request — failures are logged and dropped.
 * Mandatory call sites are listed in API_DESIGN.md ("Audit").
 */
export function audit(actor: AuthUser | null, action: AuditAction, opts: AuditOpts = {}): void {
  prisma.auditLog
    .create({
      data: {
        actorId: actor?.id ?? null,
        actorRole: actor?.role ?? null,
        action,
        targetTable: opts.targetTable,
        targetId: opts.targetId,
        targetLabel: opts.targetLabel,
        details: opts.details,
        ipAddress: opts.ip,
      },
    })
    .catch((err) => console.error("[audit] write failed:", err?.message ?? err));
}
