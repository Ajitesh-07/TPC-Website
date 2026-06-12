import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFound } from "../../middleware/errorHandler";
import { cached, bump } from "../../lib/cache";
import { audit } from "../../lib/audit";
import { notify } from "../../lib/notify";
import { pageArgs, paged, type PageQuery } from "../../lib/pagination";
import type { AuthUser } from "../../middleware/auth";

export type CreditBand = "healthy" | "low" | "critical";

export interface CreditListQuery extends PageQuery {
  search?: string;
  band?: CreditBand;
  reason?: string;
}

export interface CreditAdjustInput {
  delta: number;
  reason: string;
  note?: string;
}

/** Credit bands on students.credit_balance (see API_DESIGN.md "Credits"). */
function bandWhere(band: CreditBand): Prisma.StudentWhereInput["creditBalance"] {
  switch (band) {
    case "healthy":
      return { gte: 40 };
    case "low":
      return { gte: 16, lte: 40 };
    case "critical":
      return { lte: 15 };
  }
}

/**
 * Admin-only credit ledger. The ledger is append-only: a Postgres BEFORE INSERT
 * trigger (`apply_credit_transaction`) maintains `students.credit_balance` and
 * snapshots `balance_after` — this service must NEVER update the student row
 * itself, only insert `credit_transactions` and re-read.
 */
export const CreditsService = {
  /** Students with balance + latest ledger entry; cached 30s under `credits`. */
  async list(q: CreditListQuery) {
    return cached("credits", JSON.stringify(q), 30, async () => {
      const where: Prisma.StudentWhereInput = {};

      if (q.search) {
        where.OR = [
          { rollNo: { contains: q.search, mode: "insensitive" } },
          { user: { fullName: { contains: q.search, mode: "insensitive" } } },
        ];
      }
      if (q.band) where.creditBalance = bandWhere(q.band);
      if (q.reason) {
        // Per design note: filtering on the *latest* transaction's reason is too
        // fiddly in SQL — match students having ANY transaction whose reason
        // contains the term (case-insensitive).
        where.creditTransactions = {
          some: { reason: { contains: q.reason, mode: "insensitive" } },
        };
      }

      const [rows, total] = await prisma.$transaction([
        prisma.student.findMany({
          where,
          ...pageArgs(q),
          orderBy: { rollNo: "asc" },
          select: {
            id: true,
            rollNo: true,
            creditBalance: true,
            user: { select: { fullName: true } },
            branch: { select: { code: true } },
            creditTransactions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { delta: true, reason: true, createdAt: true },
            },
          },
        }),
        prisma.student.count({ where }),
      ]);

      const items = rows.map((s) => ({
        studentId: s.id,
        rollNo: s.rollNo,
        fullName: s.user.fullName,
        branchCode: s.branch?.code ?? null,
        creditBalance: s.creditBalance,
        latestTransaction: s.creditTransactions[0] ?? null,
      }));

      return paged(items, total, q);
    });
  },

  /** Full ledger for one student, newest first. */
  async history(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!student) throw NotFound("Student not found");

    return prisma.creditTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        delta: true,
        balanceAfter: true,
        reason: true,
        createdAt: true,
        createdByUser: { select: { fullName: true } },
      },
    });
  },

  /** Insert a ledger row (trigger maintains the balance) and return the fresh balance. */
  async adjust(studentId: string, input: CreditAdjustInput, actor: AuthUser, ip?: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, rollNo: true, user: { select: { id: true } } },
    });
    if (!student) throw NotFound("Student not found");

    const reason = input.note ? `${input.reason} — ${input.note}` : input.reason;

    const transaction = await prisma.creditTransaction.create({
      data: { studentId, delta: input.delta, reason, createdBy: actor.id },
      select: { id: true, delta: true, balanceAfter: true, reason: true, createdAt: true },
    });

    // Re-read so the response reflects the trigger-maintained balance.
    const fresh = await prisma.student.findUnique({
      where: { id: studentId },
      select: { creditBalance: true },
    });

    audit(actor, "credit_adjustment", {
      targetTable: "students",
      targetId: studentId,
      targetLabel: student.rollNo,
      details: `delta=${input.delta}; reason=${reason}`,
      ip,
    });
    bump("credits", `student:${studentId}`, "students");

    notify(student.user.id, {
      category: "profile",
      title: input.delta >= 0 ? `+${input.delta} placement credits` : `${input.delta} placement credits`,
      message: `${input.reason}. New balance: ${fresh?.creditBalance ?? "—"}.`,
      link: "/my-profile",
    });

    return { creditBalance: fresh?.creditBalance ?? null, transaction };
  },
};
