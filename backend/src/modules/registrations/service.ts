import { Prisma } from "@prisma/client";
import type { DriveProcessType, RegistrationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { audit } from "../../lib/audit";
import { pageArgs, paged, type PageQuery } from "../../lib/pagination";
import { BadRequest, Forbidden, HttpError, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/**
 * Manage Companies / Registrations (see PHASE2_DESIGN.md §4).
 *
 * Admin / super_admin own the company-registration lifecycle (list, create,
 * status change, view responses). Students see the open registrations they are
 * eligible for and submit a response. The coarse role gate lives in the route
 * plugin; row-level scoping (a student only ever acts as their own `student`
 * row, never a client-supplied id) is enforced HERE.
 */

/** Prisma Decimal → number (null-safe) for JSON responses. */
const dec = (v: Prisma.Decimal | null): number | null => (v === null ? null : Number(v));

// ---------------------------------------------------------------------------
// Query / input shapes
// ---------------------------------------------------------------------------

export interface RegistrationListQuery extends PageQuery {
  search?: string;
  status?: RegistrationStatus;
}

export interface RegistrationCreateInput {
  companyName: string;
  companyId?: string;
  industry?: string;
  processType?: DriveProcessType;
  minCpi?: number;
  /** YYYY-MM-DD parsed into a Date (the column is @db.Date). */
  registrationDeadline?: Date;
  eligibleBranchCodes: string[];
}

export interface RegistrationStatusInput {
  status: RegistrationStatus;
}

export interface RegistrationRespondInput {
  answers?: Record<string, unknown>;
}

const uniq = (xs: string[]) => [...new Set(xs)];

/**
 * Resolve branch codes to ids (preserving uniqueness). 400 if any code is
 * unknown — never let a bad code fall through to an FK 500.
 */
async function resolveBranchIds(codes: string[]): Promise<string[]> {
  const wanted = uniq(codes);
  if (wanted.length === 0) return [];
  const branches = await prisma.branch.findMany({
    where: { code: { in: wanted } },
    select: { id: true, code: true },
  });
  if (branches.length !== wanted.length) {
    const found = new Set(branches.map((b) => b.code));
    const missing = wanted.filter((c) => !found.has(c));
    throw BadRequest(`Unknown branch code(s): ${missing.join(", ")}`);
  }
  return branches.map((b) => b.id);
}

/** The student row backing the acting user; 403 if the user has no profile. */
async function ownStudent(user: AuthUser) {
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true, branchId: true, cpi: true },
  });
  if (!student) throw Forbidden("No student profile for this account");
  return student;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const RegistrationsService = {
  /** Paginated company-registration list for the Manage Companies table. */
  async list(q: RegistrationListQuery) {
    const where: Prisma.CompanyRegistrationWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.search) where.companyName = { contains: q.search, mode: "insensitive" };

    const [rows, total] = await Promise.all([
      prisma.companyRegistration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...pageArgs(q),
        select: {
          id: true,
          companyName: true,
          industry: true,
          processType: true,
          minCpi: true,
          registrationDeadline: true,
          status: true,
          createdAt: true,
          _count: { select: { registrationResponses: true } },
          registrationEligibleBranches: {
            select: { branch: { select: { code: true } } },
          },
        },
      }),
      prisma.companyRegistration.count({ where }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      industry: r.industry,
      processType: r.processType,
      minCpi: dec(r.minCpi),
      registrationDeadline: r.registrationDeadline,
      status: r.status,
      responseCount: r._count.registrationResponses,
      createdAt: r.createdAt,
      eligibleBranchCodes: r.registrationEligibleBranches.map((b) => b.branch.code),
    }));

    return paged(items, total, q);
  },

  /**
   * Create a company registration for the active placement season, with its
   * eligible-branch set. companyId, if given, is validated. Audited.
   */
  async create(input: RegistrationCreateInput, actor: AuthUser, ip?: string) {
    const season = await prisma.placementSeason.findFirst({ where: { isActive: true } });
    if (!season) throw BadRequest("No active placement season");

    if (input.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true },
      });
      if (!company) throw BadRequest("Unknown companyId");
    }

    const branchIds = await resolveBranchIds(input.eligibleBranchCodes);

    const created = await prisma.companyRegistration.create({
      data: {
        seasonId: season.id,
        companyId: input.companyId ?? null,
        companyName: input.companyName,
        industry: input.industry ?? null,
        processType: input.processType ?? null,
        minCpi: input.minCpi ?? null,
        registrationDeadline: input.registrationDeadline ?? null,
        createdBy: actor.id,
        registrationEligibleBranches: {
          create: branchIds.map((branchId) => ({ branchId })),
        },
      },
      select: { id: true },
    });

    audit(actor, "data_edit", {
      targetTable: "company_registrations",
      targetId: created.id,
      targetLabel: input.companyName,
      details: "registration created",
      ip,
    });

    return RegistrationsService.getRow(created.id);
  },

  /** Change a registration's status (open|closed|pending). Audited. */
  async setStatus(id: string, input: RegistrationStatusInput, actor: AuthUser, ip?: string) {
    const existing = await prisma.companyRegistration.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    });
    if (!existing) throw NotFound("Registration not found");

    await prisma.companyRegistration.update({
      where: { id },
      data: { status: input.status },
    });

    audit(actor, "data_edit", {
      targetTable: "company_registrations",
      targetId: id,
      targetLabel: existing.companyName,
      details: `status=${input.status}`,
      ip,
    });

    return RegistrationsService.getRow(id);
  },

  /** Responses to one registration, newest first (for the table + CSV). */
  async responses(id: string) {
    const exists = await prisma.companyRegistration.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw NotFound("Registration not found");

    const rows = await prisma.registrationResponse.findMany({
      where: { registrationId: id },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        submittedAt: true,
        student: {
          select: {
            rollNo: true,
            cpi: true,
            branch: { select: { code: true } },
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt,
      student: {
        rollNo: r.student.rollNo,
        fullName: r.student.user.fullName,
        branchCode: r.student.branch?.code ?? null,
        cpi: dec(r.student.cpi),
        email: r.student.user.email,
      },
    }));
  },

  /**
   * Open registrations the acting student is eligible for: status open, deadline
   * not yet passed, branch in the eligible set (or no branch restriction), and
   * cpi ≥ minCpi when a floor is set. Each annotated with `hasResponded`.
   */
  async openForStudent(user: AuthUser) {
    const student = await ownStudent(user);
    const studentCpi = student.cpi === null ? null : Number(student.cpi);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = await prisma.companyRegistration.findMany({
      where: {
        status: "open",
        OR: [{ registrationDeadline: null }, { registrationDeadline: { gte: today } }],
      },
      orderBy: { registrationDeadline: { sort: "asc", nulls: "last" } },
      select: {
        id: true,
        companyName: true,
        processType: true,
        registrationDeadline: true,
        minCpi: true,
        registrationEligibleBranches: { select: { branchId: true } },
        registrationResponses: {
          where: { studentId: student.id },
          select: { id: true },
          take: 1,
        },
      },
    });

    const eligible = rows.filter((r) => {
      // Branch restriction: empty set = open to all branches.
      if (r.registrationEligibleBranches.length > 0) {
        if (student.branchId === null) return false;
        if (!r.registrationEligibleBranches.some((b) => b.branchId === student.branchId)) {
          return false;
        }
      }
      // CPI floor.
      if (r.minCpi !== null) {
        if (studentCpi === null || studentCpi < Number(r.minCpi)) return false;
      }
      return true;
    });

    return eligible.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      processType: r.processType,
      registrationDeadline: r.registrationDeadline,
      hasResponded: r.registrationResponses.length > 0,
    }));
  },

  /**
   * Record the acting student's response. 400 if the registration is closed or
   * past its deadline; 409 (via P2002 on the unique (registration,student)) if
   * the student already responded.
   */
  async respond(id: string, input: RegistrationRespondInput, user: AuthUser) {
    const student = await ownStudent(user);

    const registration = await prisma.companyRegistration.findUnique({
      where: { id },
      select: { id: true, status: true, registrationDeadline: true },
    });
    if (!registration) throw NotFound("Registration not found");

    if (registration.status !== "open") throw BadRequest("Registration is not open");
    if (registration.registrationDeadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (registration.registrationDeadline < today) {
        throw BadRequest("Registration deadline has passed");
      }
    }

    try {
      const response = await prisma.registrationResponse.create({
        data: {
          registrationId: id,
          studentId: student.id,
          answers: (input.answers ?? {}) as Prisma.InputJsonValue,
        },
        select: { id: true, submittedAt: true },
      });
      return { id: response.id, submittedAt: response.submittedAt };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new HttpError(409, "You have already responded to this registration", "already_responded");
      }
      throw err;
    }
  },

  /** Single serialised registration row (shared by create/setStatus responses). */
  async getRow(id: string) {
    const r = await prisma.companyRegistration.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        industry: true,
        processType: true,
        minCpi: true,
        registrationDeadline: true,
        status: true,
        createdAt: true,
        _count: { select: { registrationResponses: true } },
        registrationEligibleBranches: { select: { branch: { select: { code: true } } } },
      },
    });
    if (!r) throw NotFound("Registration not found");
    return {
      id: r.id,
      companyName: r.companyName,
      industry: r.industry,
      processType: r.processType,
      minCpi: dec(r.minCpi),
      registrationDeadline: r.registrationDeadline,
      status: r.status,
      responseCount: r._count.registrationResponses,
      createdAt: r.createdAt,
      eligibleBranchCodes: r.registrationEligibleBranches.map((b) => b.branch.code),
    };
  },
};
