import { Prisma, type StageStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { cached, bump } from "../../lib/cache";
import { audit } from "../../lib/audit";
import { notify, notifyRole } from "../../lib/notify";
import { queues } from "../../lib/queue";
import { pageArgs, paged } from "../../lib/pagination";
import { BadRequest, Forbidden, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";
import type {
  ApplicantsQuery,
  DriveCreateInput,
  DriveDecisionInput,
  DriveListQuery,
  DriveUpdateInput,
} from "./schemas";

/**
 * Row-level access control lives HERE, not in the route guard. A recruiter only
 * manages their company's drives; a coordinator only their assigned drives; a
 * student may browse any OPEN drive (the catalogue shows ineligible drives with
 * reasons) but nothing pre-approval. Never trust an id from the client — always
 * scope by the authenticated user.
 */

/** Prisma Decimal → number (null-safe) for JSON responses. */
const dec = (v: Prisma.Decimal | null): number | null => (v === null ? null : Number(v));

// ---------------------------------------------------------------------------
// Query shapes + serialisers
// ---------------------------------------------------------------------------

const cardInclude = {
  company: { select: { id: true, name: true, logoUrl: true, industry: true } },
  driveSkills: { select: { skill: { select: { name: true } } } },
  driveStages: {
    where: { status: "ongoing" },
    orderBy: { sequence: "asc" },
    take: 1,
    select: { type: true, status: true },
  },
} satisfies Prisma.DriveInclude;

type DriveCardRow = Prisma.DriveGetPayload<{ include: typeof cardInclude }>;

function toCard(d: DriveCardRow) {
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    processType: d.processType,
    location: d.location,
    ctcLpa: dec(d.ctcLpa),
    stipendPerMonth: dec(d.stipendPerMonth),
    minCpi: dec(d.minCpi),
    allowBacklog: d.allowBacklog,
    openings: d.openings,
    applicationDeadline: d.applicationDeadline,
    createdAt: d.createdAt,
    company: d.company,
    skills: d.driveSkills.map((s) => s.skill.name),
    currentStage: d.driveStages[0] ?? null,
  };
}

type DriveCard = ReturnType<typeof toCard> & {
  eligibility?: { isEligible: boolean; reasons: string[] };
  hasApplied?: boolean;
};

const detailInclude = {
  company: { select: { id: true, name: true, logoUrl: true, industry: true } },
  driveSkills: { select: { skill: { select: { name: true } } } },
  driveStages: { orderBy: { sequence: "asc" } },
  driveDocuments: { orderBy: { uploadedAt: "desc" } },
  driveEligibleBranches: { select: { branch: { select: { id: true, code: true, name: true } } } },
  driveEligiblePrograms: { select: { program: { select: { id: true, code: true, name: true } } } },
} satisfies Prisma.DriveInclude;

type DriveDetailRow = Prisma.DriveGetPayload<{ include: typeof detailInclude }>;

function toDetail(d: DriveDetailRow) {
  const stages = d.driveStages.map((s) => ({
    id: s.id,
    type: s.type,
    label: s.label,
    sequence: s.sequence,
    status: s.status,
    scheduledAt: s.scheduledAt,
    location: s.location,
  }));
  const ongoing = stages.find((s) => s.status === "ongoing");
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    status: d.status,
    processType: d.processType,
    location: d.location,
    ctcLpa: dec(d.ctcLpa),
    stipendPerMonth: dec(d.stipendPerMonth),
    minCpi: dec(d.minCpi),
    allowBacklog: d.allowBacklog,
    customRules: d.customRules,
    openings: d.openings,
    applicationDeadline: d.applicationDeadline,
    approvedAt: d.approvedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    company: d.company,
    skills: d.driveSkills.map((s) => s.skill.name),
    stages,
    currentStage: ongoing ? { type: ongoing.type, status: ongoing.status } : null,
    documents: d.driveDocuments.map((doc) => ({
      id: doc.id,
      type: doc.type,
      name: doc.name,
      fileUrl: doc.fileUrl,
      uploadedAt: doc.uploadedAt,
    })),
    eligibleBranches: d.driveEligibleBranches.map((b) => b.branch),
    eligiblePrograms: d.driveEligiblePrograms.map((p) => p.program),
  };
}

type DriveDetail = ReturnType<typeof toDetail> & {
  eligibility?: { isEligible: boolean; reasons: string[] };
  hasApplied?: boolean;
};

async function loadDetail(driveId: string): Promise<DriveDetail> {
  const d = await prisma.drive.findUnique({ where: { id: driveId }, include: detailInclude });
  if (!d) throw NotFound("Drive not found");
  return toDetail(d);
}

// ---------------------------------------------------------------------------
// Shared authz / validation helpers
// ---------------------------------------------------------------------------

async function assertAssignedCoordinator(driveId: string, user: AuthUser): Promise<void> {
  const assigned = await prisma.coordinatorAssignment.findFirst({
    where: { driveId, coordinator: { userId: user.id } },
    select: { id: true },
  });
  if (!assigned) throw Forbidden();
}

/** branchIds / programIds must reference existing rows (400, not an FK 500). */
async function assertRefsExist(branchIds: string[], programIds: string[]): Promise<void> {
  if (branchIds.length > 0) {
    const n = await prisma.branch.count({ where: { id: { in: branchIds } } });
    if (n !== branchIds.length) throw BadRequest("One or more branchIds do not exist");
  }
  if (programIds.length > 0) {
    const n = await prisma.program.count({ where: { id: { in: programIds } } });
    if (n !== programIds.length) throw BadRequest("One or more programIds do not exist");
  }
}

function enqueueEligibility(driveId: string): void {
  // Fire-and-forget: a Redis hiccup must not fail the request; the 60–120s
  // cache TTLs and the next rule change are the backstop.
  queues.eligibility
    .add("recompute", { driveId })
    .catch((err) => console.error("[drives] eligibility enqueue failed:", err?.message ?? err));
}

const uniq = (xs: string[]) => [...new Set(xs)];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const DrivesService = {
  /**
   * Role-scoped catalogue. Students see ALL open drives, each annotated with
   * their cached eligibility verdict + whether they already applied.
   */
  async list(user: AuthUser, q: DriveListQuery) {
    const suffix = `${user.role}:${user.id}:${JSON.stringify(q)}`;
    return cached("drives", suffix, 60, async () => {
      const filters: Prisma.DriveWhereInput = {};
      if (q.status) filters.status = q.status;
      if (q.processType) filters.processType = q.processType;
      if (q.search) {
        filters.OR = [
          { title: { contains: q.search, mode: "insensitive" } },
          { company: { name: { contains: q.search, mode: "insensitive" } } },
        ];
      }

      const orderBy: Prisma.DriveOrderByWithRelationInput =
        q.sort === "deadline"
          ? { applicationDeadline: { sort: "asc", nulls: "last" } }
          : q.sort === "ctc"
            ? { ctcLpa: { sort: "desc", nulls: "last" } }
            : q.sort === "company"
              ? { company: { name: "asc" } }
              : { createdAt: "desc" };

      let where: Prisma.DriveWhereInput = filters;
      let studentId: string | null = null;

      switch (user.role) {
        case "company": {
          const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
          if (!rec) return paged([], 0, q);
          where = { ...filters, companyId: rec.companyId };
          break;
        }
        case "coordinator": {
          const coord = await prisma.coordinator.findUnique({ where: { userId: user.id } });
          if (!coord) return paged([], 0, q);
          const assigned = await prisma.coordinatorAssignment.findMany({
            where: { coordinatorId: coord.id },
            select: { driveId: true },
          });
          where = { ...filters, id: { in: assigned.map((a) => a.driveId) } };
          break;
        }
        case "student": {
          const student = await prisma.student.findUnique({ where: { userId: user.id } });
          if (!student) return paged([], 0, q);
          studentId = student.id;
          where = { ...filters, status: "open" }; // catalogue: every open drive
          break;
        }
        default:
          break; // admin | super_admin — unrestricted
      }

      const [rows, total] = await Promise.all([
        prisma.drive.findMany({ where, orderBy, include: cardInclude, ...pageArgs(q) }),
        prisma.drive.count({ where }),
      ]);

      const items: DriveCard[] = rows.map(toCard);

      if (studentId !== null) {
        const driveIds = items.map((i) => i.id);
        // Single round-trip each — no per-drive N+1.
        const [elig, apps] = await Promise.all([
          prisma.driveEligibility.findMany({
            where: { studentId, driveId: { in: driveIds } },
            select: { driveId: true, isEligible: true, reasons: true },
          }),
          prisma.application.findMany({
            where: { studentId, driveId: { in: driveIds } },
            select: { driveId: true },
          }),
        ]);
        const eligByDrive = new Map(elig.map((e) => [e.driveId, e]));
        const appliedTo = new Set(apps.map((a) => a.driveId));
        for (const item of items) {
          const e = eligByDrive.get(item.id);
          item.eligibility = e
            ? { isEligible: e.isEligible, reasons: e.reasons }
            : { isEligible: false, reasons: [] }; // not computed yet → treat as not eligible
          item.hasApplied = appliedTo.has(item.id);
        }
      }

      return paged(items, total, q);
    });
  },

  /** Full drive detail (ordered stages, documents, eligible branches/programs). */
  async get(driveId: string, user: AuthUser) {
    return cached(`drive:${driveId}`, `detail:${user.role}:${user.id}`, 120, async () => {
      await DrivesService.assertCanView(driveId, user);
      const detail = await loadDetail(driveId);

      if (user.role === "student") {
        const student = await prisma.student.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (student) {
          const [elig, app] = await Promise.all([
            prisma.driveEligibility.findUnique({
              where: { driveId_studentId: { driveId, studentId: student.id } },
              select: { isEligible: true, reasons: true },
            }),
            prisma.application.findFirst({
              where: { driveId, studentId: student.id },
              select: { id: true },
            }),
          ]);
          detail.eligibility = elig
            ? { isEligible: elig.isEligible, reasons: elig.reasons }
            : { isEligible: false, reasons: [] };
          detail.hasApplied = app !== null;
        }
      }
      return detail;
    });
  },

  /** Create a draft drive. Recruiters always create for their own company. */
  async create(user: AuthUser, input: DriveCreateInput) {
    let companyId: string;
    if (user.role === "company") {
      const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
      if (!rec) throw Forbidden("No recruiter profile for this account");
      companyId = rec.companyId; // never trust a client-supplied companyId
    } else {
      if (!input.companyId) throw BadRequest("companyId is required");
      const company = await prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true },
      });
      if (!company) throw BadRequest("Unknown companyId");
      companyId = company.id;
    }

    const season = await prisma.placementSeason.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!season) throw BadRequest("No active placement season");

    const branchIds = uniq(input.branchIds);
    const programIds = uniq(input.programIds);
    const skillNames = uniq(input.skillNames);
    await assertRefsExist(branchIds, programIds);

    const created = await prisma.drive.create({
      data: {
        seasonId: season.id,
        companyId,
        createdBy: user.id,
        title: input.title,
        description: input.description ?? null,
        processType: input.processType,
        location: input.location ?? null,
        ctcLpa: input.ctcLpa ?? null,
        stipendPerMonth: input.stipendPerMonth ?? null,
        minCpi: input.minCpi ?? null,
        allowBacklog: input.allowBacklog,
        customRules: input.customRules ?? null,
        openings: input.openings ?? null,
        applicationDeadline: input.applicationDeadline ?? null,
        status: "draft",
        driveEligibleBranches: { create: branchIds.map((branchId) => ({ branchId })) },
        driveEligiblePrograms: { create: programIds.map((programId) => ({ programId })) },
        driveSkills: {
          create: skillNames.map((name) => ({
            skill: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
        driveStages: {
          create: input.stages.map((s) => ({
            type: s.type,
            label: s.label ?? null,
            sequence: s.sequence,
            scheduledAt: s.scheduledAt ?? null,
            location: s.location ?? null,
          })),
        },
      },
      select: { id: true },
    });

    bump("drives");
    return loadDetail(created.id);
  },

  /**
   * Partial update. Replacing branchIds / programIds / skillNames / stages is a
   * delete + recreate inside one transaction. Changing an eligibility-rule
   * field on an OPEN drive triggers an async recompute.
   */
  async update(driveId: string, user: AuthUser, input: DriveUpdateInput) {
    const drive = await DrivesService.assertCanEdit(driveId, user);

    const branchIds = input.branchIds ? uniq(input.branchIds) : undefined;
    const programIds = input.programIds ? uniq(input.programIds) : undefined;
    const skillNames = input.skillNames ? uniq(input.skillNames) : undefined;
    await assertRefsExist(branchIds ?? [], programIds ?? []);

    const data: Prisma.DriveUncheckedUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.processType !== undefined) data.processType = input.processType;
    if (input.location !== undefined) data.location = input.location;
    if (input.ctcLpa !== undefined) data.ctcLpa = input.ctcLpa;
    if (input.stipendPerMonth !== undefined) data.stipendPerMonth = input.stipendPerMonth;
    if (input.minCpi !== undefined) data.minCpi = input.minCpi;
    if (input.allowBacklog !== undefined) data.allowBacklog = input.allowBacklog;
    if (input.customRules !== undefined) data.customRules = input.customRules;
    if (input.openings !== undefined) data.openings = input.openings;
    if (input.applicationDeadline !== undefined)
      data.applicationDeadline = input.applicationDeadline;
    if (input.companyId !== undefined && (user.role === "admin" || user.role === "super_admin")) {
      const company = await prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true },
      });
      if (!company) throw BadRequest("Unknown companyId");
      data.companyId = company.id;
    }

    await prisma.$transaction(async (tx) => {
      await tx.drive.update({ where: { id: driveId }, data });

      if (branchIds) {
        await tx.driveEligibleBranch.deleteMany({ where: { driveId } });
        if (branchIds.length > 0) {
          await tx.driveEligibleBranch.createMany({
            data: branchIds.map((branchId) => ({ driveId, branchId })),
          });
        }
      }
      if (programIds) {
        await tx.driveEligibleProgram.deleteMany({ where: { driveId } });
        if (programIds.length > 0) {
          await tx.driveEligibleProgram.createMany({
            data: programIds.map((programId) => ({ driveId, programId })),
          });
        }
      }
      if (skillNames) {
        await tx.driveSkill.deleteMany({ where: { driveId } });
        for (const name of skillNames) {
          const skill = await tx.skill.upsert({ where: { name }, update: {}, create: { name } });
          await tx.driveSkill.create({ data: { driveId, skillId: skill.id } });
        }
      }
      if (input.stages) {
        await tx.driveStage.deleteMany({ where: { driveId } });
        if (input.stages.length > 0) {
          await tx.driveStage.createMany({
            data: input.stages.map((s) => ({
              driveId,
              type: s.type,
              label: s.label ?? null,
              sequence: s.sequence,
              scheduledAt: s.scheduledAt ?? null,
              location: s.location ?? null,
            })),
          });
        }
      }
    });

    const rulesTouched =
      input.minCpi !== undefined ||
      input.allowBacklog !== undefined ||
      branchIds !== undefined ||
      programIds !== undefined;
    if (rulesTouched && drive.status === "open") enqueueEligibility(driveId);

    bump("drives", `drive:${driveId}`);
    return loadDetail(driveId);
  },

  /** draft → pending_approval (owner recruiter, assigned coordinator, admin). */
  async submit(driveId: string, user: AuthUser) {
    const drive = await DrivesService.assertCanEdit(driveId, user);
    if (drive.status !== "draft") throw BadRequest("Only draft drives can be submitted");

    await prisma.drive.update({ where: { id: driveId }, data: { status: "pending_approval" } });
    bump("drives", `drive:${driveId}`, "dash:admin");

    const meta = await prisma.drive.findUnique({
      where: { id: driveId },
      select: { title: true, company: { select: { name: true } } },
    });
    notifyRole(["admin", "super_admin"], {
      category: "drive",
      title: "Drive awaiting approval",
      message: `${meta?.company.name ?? "A company"} — ${meta?.title ?? "a drive"} needs TPC review.`,
      link: "/admin-dashboard",
    });
    return loadDetail(driveId);
  },

  /** Admin decision on a pending drive: approve → open, reject → cancelled. */
  async decide(driveId: string, user: AuthUser, input: DriveDecisionInput, ip?: string) {
    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      include: { company: { select: { name: true } } },
    });
    if (!drive) throw NotFound("Drive not found");
    if (drive.status !== "pending_approval") throw BadRequest("Drive is not pending approval");

    await prisma.drive.update({
      where: { id: driveId },
      data: {
        status: input.approve ? "open" : "cancelled",
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    });

    audit(user, "approval", {
      targetTable: "drives",
      targetId: driveId,
      targetLabel: `${drive.company.name} — ${drive.title}`,
      details: `${input.approve ? "approved" : "rejected"}${input.note ? `: ${input.note}` : ""}`,
      ip,
    });

    if (input.approve) enqueueEligibility(driveId);
    bump("drives", `drive:${driveId}`, "dash:admin");

    if (drive.createdBy) {
      notify(drive.createdBy, {
        category: "drive",
        title: input.approve ? "Drive approved" : "Drive not approved",
        message: input.approve
          ? `"${drive.title}" is now open for applications.`
          : `"${drive.title}" was returned by the TPC${input.note ? `: ${input.note}` : ""}.`,
        link: "/company-drives",
      });
    }
    return loadDetail(driveId);
  },

  /**
   * Stage status change (assigned coordinator / admin). Setting a stage to
   * "ongoing" completes any other currently-ongoing stage of the drive.
   */
  async setStageStatus(driveId: string, stageId: string, status: StageStatus, user: AuthUser) {
    const drive = await prisma.drive.findUnique({ where: { id: driveId }, select: { id: true } });
    if (!drive) throw NotFound("Drive not found");
    if (user.role === "coordinator") await assertAssignedCoordinator(driveId, user);
    else if (user.role !== "admin" && user.role !== "super_admin") throw Forbidden();

    const stage = await prisma.driveStage.findFirst({
      where: { id: stageId, driveId },
      select: { id: true },
    });
    if (!stage) throw NotFound("Stage not found");

    const updated = await prisma.$transaction(async (tx) => {
      if (status === "ongoing") {
        // Only one stage of a drive may be ongoing at a time.
        await tx.driveStage.updateMany({
          where: { driveId, status: "ongoing", id: { not: stageId } },
          data: { status: "completed" },
        });
      }
      return tx.driveStage.update({ where: { id: stageId }, data: { status } });
    });

    bump(`drive:${driveId}`, "drives");
    return {
      id: updated.id,
      type: updated.type,
      label: updated.label,
      sequence: updated.sequence,
      status: updated.status,
      scheduledAt: updated.scheduledAt,
      location: updated.location,
    };
  },

  /** Applicant roster: own-company recruiter, assigned coordinator, admin. */
  async applicants(driveId: string, user: AuthUser, q: ApplicantsQuery) {
    await DrivesService.assertCanView(driveId, user); // route gate excludes students

    const where: Prisma.ApplicationWhereInput = { driveId };
    if (q.status) where.status = q.status;
    if (q.search) {
      where.student = {
        OR: [
          { rollNo: { contains: q.search, mode: "insensitive" } },
          { user: { fullName: { contains: q.search, mode: "insensitive" } } },
        ],
      };
    }

    const [rows, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              rollNo: true,
              cpi: true,
              resumeUrl: true,
              branch: { select: { code: true } },
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { appliedAt: "desc" },
        ...pageArgs(q),
      }),
      prisma.application.count({ where }),
    ]);

    return paged(
      rows.map((a) => ({
        id: a.id,
        status: a.status,
        isShortlisted: a.isShortlisted,
        appliedAt: a.appliedAt,
        currentStageId: a.currentStageId,
        student: {
          id: a.student.id,
          rollNo: a.student.rollNo,
          fullName: a.student.user.fullName,
          branchCode: a.student.branch?.code ?? null,
          cpi: dec(a.student.cpi),
          resumeUrl: a.student.resumeUrl,
        },
      })),
      total,
      q
    );
  },

  /**
   * Throws 404/403 unless `user` may view this drive.
   * Staff: admins always; recruiters their company's drives; coordinators their
   * assigned drives. Students: any OPEN drive (catalogue lists ineligible drives
   * with reasons) or a drive they have an application on.
   */
  async assertCanView(driveId: string, user: AuthUser) {
    const drive = await prisma.drive.findUnique({ where: { id: driveId } });
    if (!drive) throw NotFound("Drive not found");

    if (user.role === "admin" || user.role === "super_admin") return drive;

    if (user.role === "company") {
      const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
      if (!rec || rec.companyId !== drive.companyId) throw Forbidden();
      return drive;
    }

    if (user.role === "coordinator") {
      await assertAssignedCoordinator(driveId, user);
      return drive;
    }

    // student
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!student) throw Forbidden();
    if (drive.status !== "open") {
      const applied = await prisma.application.findFirst({
        where: { driveId, studentId: student.id },
        select: { id: true },
      });
      if (!applied) throw Forbidden();
    }
    return drive;
  },

  /**
   * Throws unless `user` may edit this drive: admins always; assigned
   * coordinators always; the owning company's recruiters only while the drive
   * is still draft / pending_approval.
   */
  async assertCanEdit(driveId: string, user: AuthUser) {
    const drive = await prisma.drive.findUnique({ where: { id: driveId } });
    if (!drive) throw NotFound("Drive not found");

    if (user.role === "admin" || user.role === "super_admin") return drive;

    if (user.role === "company") {
      const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
      if (!rec || rec.companyId !== drive.companyId) throw Forbidden();
      if (drive.status !== "draft" && drive.status !== "pending_approval") {
        throw Forbidden("Drive can no longer be edited by the company");
      }
      return drive;
    }

    if (user.role === "coordinator") {
      await assertAssignedCoordinator(driveId, user);
      return drive;
    }

    throw Forbidden();
  },
};
