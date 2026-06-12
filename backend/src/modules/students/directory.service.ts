import type { CorrectionStatus, PlacementStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { BadRequest, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";
import { cached, bump } from "../../lib/cache";
import { notify } from "../../lib/notify";
import { audit } from "../../lib/audit";
import { pageArgs, paged, type PageQuery } from "../../lib/pagination";
import { queues } from "../../lib/queue";

export type DirectoryListParams = PageQuery & {
  search?: string;
  branch?: string;
  placementStatus?: PlacementStatus;
};

export type StudentAcademicPatch = {
  cpi?: number;
  branchId?: string;
  programId?: string;
  batchYear?: number;
  activeBacklogs?: number;
  placementStatus?: PlacementStatus;
  btechVerified?: boolean;
};

export type CorrectionListParams = PageQuery & {
  status?: CorrectionStatus;
};

/** Prisma Decimal → number (null-safe) for JSON responses. */
const num = (d: Prisma.Decimal | null): number | null => (d === null ? null : Number(d));

/** Enqueue an eligibility recompute; a Redis hiccup must never fail the request. */
function enqueueEligibility(studentId: string): void {
  queues.eligibility
    .add("recompute", { studentId })
    .catch((err) => console.error("[students] eligibility enqueue failed:", err?.message ?? err));
}

/**
 * Staff directory + admin operations over students. Coarse role gating happens
 * in the routes (coordinator/admin/super_admin read; admin/super_admin write);
 * there is no per-row scoping here because the directory is, by contract,
 * visible in full to those staff roles.
 */
export const StudentsDirectoryService = {
  /** GET /students — cached under `students` (bumped on PATCH/block/master changes). */
  async list(params: DirectoryListParams) {
    return cached("students", JSON.stringify(params), 60, async () => {
      const where: Prisma.StudentWhereInput = {};
      if (params.search) {
        where.OR = [
          { user: { fullName: { contains: params.search, mode: "insensitive" } } },
          { rollNo: { contains: params.search, mode: "insensitive" } },
          { user: { email: { contains: params.search, mode: "insensitive" } } },
        ];
      }
      if (params.branch) {
        where.branch = { code: { equals: params.branch, mode: "insensitive" } };
      }
      if (params.placementStatus) where.placementStatus = params.placementStatus;

      const [rows, total] = await prisma.$transaction([
        prisma.student.findMany({
          where,
          include: {
            user: { select: { fullName: true, email: true } },
            branch: { select: { code: true, name: true } },
          },
          orderBy: { rollNo: "asc" },
          ...pageArgs(params),
        }),
        prisma.student.count({ where }),
      ]);

      const items = rows.map((s) => ({
        id: s.id,
        rollNo: s.rollNo,
        fullName: s.user.fullName,
        email: s.user.email,
        branch: s.branch ? { code: s.branch.code, name: s.branch.name } : null,
        cpi: num(s.cpi),
        placementStatus: s.placementStatus,
        isBlocked: s.isBlocked,
        creditBalance: s.creditBalance,
        batchYear: s.batchYear,
      }));
      return paged(items, total, params);
    });
  },

  /** GET /students/:id — full profile, cached under `student:<id>`. */
  async get(id: string) {
    return cached(`student:${id}`, "directory-profile", 30, async () => {
      const s = await prisma.student.findUnique({
        where: { id },
        include: {
          user: { select: { fullName: true, email: true } },
          branch: { select: { id: true, code: true, name: true } },
          program: { select: { id: true, code: true, name: true } },
          studentSkills: { include: { skill: { select: { name: true } } } },
        },
      });
      if (!s) throw NotFound("Student not found");

      const [applications, shortlisted] = await prisma.$transaction([
        prisma.application.count({ where: { studentId: id } }),
        prisma.application.count({ where: { studentId: id, isShortlisted: true } }),
      ]);

      return {
        id: s.id,
        rollNo: s.rollNo,
        fullName: s.user.fullName,
        email: s.user.email,
        branch: s.branch,
        program: s.program,
        batchYear: s.batchYear,
        cpi: num(s.cpi),
        activeBacklogs: s.activeBacklogs,
        btechVerified: s.btechVerified,
        emailVerified: s.emailVerified,
        placementStatus: s.placementStatus,
        isBlocked: s.isBlocked,
        blockedReason: s.blockedReason,
        creditBalance: s.creditBalance,
        phone: s.phone,
        altEmail: s.altEmail,
        resumeUrl: s.resumeUrl,
        linkedinUrl: s.linkedinUrl,
        githubUrl: s.githubUrl,
        preferredLocation: s.preferredLocation,
        skills: s.studentSkills.map((ss) => ss.skill.name),
        counts: { applications, shortlisted },
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });
  },

  /** PATCH /students/:id — admin edit of academic fields. */
  async update(id: string, patch: StudentAcademicPatch, actor: AuthUser, ip?: string) {
    const existing = await prisma.student.findUnique({
      where: { id },
      select: { id: true, rollNo: true },
    });
    if (!existing) throw NotFound("Student not found");

    // Validate FK targets up front so a bad id is a 400, not a Prisma P2003.
    if (patch.branchId !== undefined) {
      const branch = await prisma.branch.findUnique({
        where: { id: patch.branchId },
        select: { id: true },
      });
      if (!branch) throw BadRequest("Unknown branchId");
    }
    if (patch.programId !== undefined) {
      const program = await prisma.program.findUnique({
        where: { id: patch.programId },
        select: { id: true },
      });
      if (!program) throw BadRequest("Unknown programId");
    }

    const updated = await prisma.student.update({
      where: { id },
      data: patch,
      include: {
        user: { select: { fullName: true, email: true } },
        branch: { select: { id: true, code: true, name: true } },
        program: { select: { id: true, code: true, name: true } },
      },
    });

    audit(actor, "data_edit", {
      targetTable: "students",
      targetId: id,
      targetLabel: existing.rollNo,
      details: JSON.stringify(patch),
      ip,
    });
    enqueueEligibility(id);
    bump("students", `student:${id}`);

    return {
      id: updated.id,
      rollNo: updated.rollNo,
      fullName: updated.user.fullName,
      email: updated.user.email,
      branch: updated.branch,
      program: updated.program,
      batchYear: updated.batchYear,
      cpi: num(updated.cpi),
      activeBacklogs: updated.activeBacklogs,
      btechVerified: updated.btechVerified,
      placementStatus: updated.placementStatus,
      isBlocked: updated.isBlocked,
      creditBalance: updated.creditBalance,
    };
  },

  /** POST /students/:id/block — block/unblock with a reason. */
  async setBlocked(id: string, blocked: boolean, reason: string | undefined, actor: AuthUser, ip?: string) {
    const existing = await prisma.student.findUnique({
      where: { id },
      select: { id: true, rollNo: true },
    });
    if (!existing) throw NotFound("Student not found");

    const updated = await prisma.student.update({
      where: { id },
      data: { isBlocked: blocked, blockedReason: blocked ? (reason ?? null) : null },
      select: { id: true, rollNo: true, isBlocked: true, blockedReason: true },
    });

    audit(actor, "policy", {
      targetTable: "students",
      targetId: id,
      targetLabel: existing.rollNo,
      details: JSON.stringify({ blocked, reason: reason ?? null }),
      ip,
    });
    enqueueEligibility(id);
    bump("students", `student:${id}`);

    return updated;
  },

  /** GET /corrections — admin review queue. */
  async listCorrections(params: CorrectionListParams) {
    const where: Prisma.DataCorrectionRequestWhereInput = {};
    if (params.status) where.status = params.status;

    const [rows, total] = await prisma.$transaction([
      prisma.dataCorrectionRequest.findMany({
        where,
        include: {
          student: { select: { rollNo: true, user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        ...pageArgs(params),
      }),
      prisma.dataCorrectionRequest.count({ where }),
    ]);

    const items = rows.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      student: { rollNo: c.student.rollNo, fullName: c.student.user.fullName },
      fieldName: c.fieldName,
      currentValue: c.currentValue,
      requestedValue: c.requestedValue,
      reason: c.reason,
      status: c.status,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt,
      createdAt: c.createdAt,
    }));
    return paged(items, total, params);
  },

  /**
   * POST /corrections/:id/review — approve/reject. On approve, numeric fields
   * (cpi, batchYear) are applied to the student record; everything else is left
   * for manual handling per the contract.
   */
  async reviewCorrection(id: string, approve: boolean, note: string | undefined, actor: AuthUser, ip?: string) {
    const correction = await prisma.dataCorrectionRequest.findUnique({
      where: { id },
      include: { student: { select: { id: true, rollNo: true, user: { select: { id: true } } } } },
    });
    if (!correction) throw NotFound("Correction request not found");
    if (correction.status !== "pending") throw BadRequest("Correction request already reviewed");

    // Decide whether (and what) to apply before touching the DB.
    let applyData: Prisma.StudentUpdateInput | null = null;
    if (approve && (correction.fieldName === "cpi" || correction.fieldName === "batchYear")) {
      const raw = (correction.requestedValue ?? "").trim();
      const value = Number(raw);
      if (raw === "" || Number.isNaN(value)) {
        throw BadRequest(`Requested value for ${correction.fieldName} is not numeric`);
      }
      if (correction.fieldName === "cpi") {
        if (value < 0 || value > 10) throw BadRequest("CPI must be between 0 and 10");
        applyData = { cpi: value };
      } else {
        if (!Number.isInteger(value) || value < 1900 || value > 2100) {
          throw BadRequest("batchYear must be an integer year");
        }
        applyData = { batchYear: value };
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (applyData) {
        await tx.student.update({ where: { id: correction.studentId }, data: applyData });
      }
      return tx.dataCorrectionRequest.update({
        where: { id },
        data: {
          status: approve ? "approved" : "rejected",
          reviewedBy: actor.id,
          reviewedAt: new Date(),
        },
      });
    });

    audit(actor, "approval", {
      targetTable: "data_correction_requests",
      targetId: id,
      targetLabel: correction.student.rollNo,
      details: JSON.stringify({
        fieldName: correction.fieldName,
        approve,
        applied: applyData !== null,
        note: note ?? null,
      }),
      ip,
    });
    // An applied cpi/batchYear change affects eligibility, same as an admin edit.
    if (applyData) enqueueEligibility(correction.studentId);
    bump(`student:${correction.studentId}`, "students");

    notify(correction.student.user.id, {
      category: "profile",
      title: approve ? "Correction approved" : "Correction reviewed",
      message: `Your ${correction.fieldName} correction request was ${approve ? "approved" : "rejected"}${note ? `: ${note}` : ""}.`,
      link: "/my-profile",
    });

    return {
      id: updated.id,
      studentId: updated.studentId,
      fieldName: updated.fieldName,
      status: updated.status,
      reviewedBy: updated.reviewedBy,
      reviewedAt: updated.reviewedAt,
      applied: applyData !== null,
    };
  },
};
