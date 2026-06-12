import { Prisma, type DataCorrectionRequest, type Event as EventRow } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { cached, bump } from "../../lib/cache";
import { BadRequest, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/**
 * Student self-service (see API_DESIGN.md "Me / student self-service").
 * Row-level scoping: every method resolves the student row from the
 * AUTHENTICATED user id — client-supplied ids are never trusted.
 */

/** Fields a student may request a correction for (API contract enum). */
export const CORRECTION_FIELDS = ["cpi", "branch", "program", "batchYear", "name", "rollNo"] as const;
export type CorrectionField = (typeof CORRECTION_FIELDS)[number];

const PROFILE_INCLUDE = {
  branch: true,
  program: true,
  studentSkills: { include: { skill: true } },
} satisfies Prisma.StudentInclude;

type StudentProfileRow = Prisma.StudentGetPayload<{ include: typeof PROFILE_INCLUDE }>;

/**
 * API shape of a student profile: Decimal cpi → number, relations flattened to
 * `branch {id,code,name}`, `program {id,code,name}`, `skills: string[]`.
 * The `resume_url` column stores the S3 object KEY (from POST /uploads/presign),
 * so it is exposed as `resumeKey` (clients turn it into a URL via /files/presign).
 */
export function serializeStudentProfile(s: StudentProfileRow) {
  return {
    id: s.id,
    userId: s.userId,
    rollNo: s.rollNo,
    batchYear: s.batchYear,
    cpi: s.cpi === null ? null : s.cpi.toNumber(),
    activeBacklogs: s.activeBacklogs,
    btechVerified: s.btechVerified,
    emailVerified: s.emailVerified,
    placementStatus: s.placementStatus,
    isBlocked: s.isBlocked,
    blockedReason: s.blockedReason,
    creditBalance: s.creditBalance,
    phone: s.phone,
    altEmail: s.altEmail,
    resumeKey: s.resumeUrl,
    linkedinUrl: s.linkedinUrl,
    githubUrl: s.githubUrl,
    preferredLocation: s.preferredLocation,
    branch: s.branch ? { id: s.branch.id, code: s.branch.code, name: s.branch.name } : null,
    program: s.program ? { id: s.program.id, code: s.program.code, name: s.program.name } : null,
    skills: s.studentSkills.map((ss) => ss.skill.name),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export type StudentProfile = ReturnType<typeof serializeStudentProfile>;

export interface UpdateProfileInput {
  phone?: string | null;
  altEmail?: string | null;
  resumeKey?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  preferredLocation?: string | null;
  skills?: string[];
}

export interface CreateCorrectionInput {
  fieldName: CorrectionField;
  requestedValue: string;
  reason?: string;
}

/** Event rows serialised per the API conventions (date → YYYY-MM-DD, time → HH:MM:SS). */
function serializeEvent(e: EventRow) {
  return {
    id: e.id,
    type: e.type,
    scope: e.scope,
    title: e.title,
    detail: e.detail,
    eventDate: e.eventDate.toISOString().slice(0, 10),
    startTime: e.startTime ? e.startTime.toISOString().slice(11, 19) : null,
    endTime: e.endTime ? e.endTime.toISOString().slice(11, 19) : null,
    location: e.location,
    driveId: e.driveId,
  };
}

/** Profile-completeness checklist (API_DESIGN.md): 6 contact fields + "≥3 skills". */
function completenessOf(profile: StudentProfile): number {
  const fields = [
    profile.phone,
    profile.altEmail,
    profile.resumeKey,
    profile.linkedinUrl,
    profile.githubUrl,
    profile.preferredLocation,
  ];
  const present =
    fields.filter((v) => v !== null && v.trim() !== "").length +
    (profile.skills.length >= 3 ? 1 : 0);
  return Math.round((present / (fields.length + 1)) * 100);
}

function correctionCurrentValue(
  student: Prisma.StudentGetPayload<{
    include: { branch: true; program: true; user: { select: { fullName: true } } };
  }>,
  field: CorrectionField
): string | null {
  switch (field) {
    case "cpi":
      return student.cpi === null ? null : String(student.cpi.toNumber());
    case "branch":
      return student.branch?.code ?? null;
    case "program":
      return student.program?.code ?? null;
    case "batchYear":
      return student.batchYear === null ? null : String(student.batchYear);
    case "name":
      return student.user.fullName;
    case "rollNo":
      return student.rollNo;
  }
}

async function buildDashboard(userId: string, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { ...PROFILE_INCLUDE, user: { select: { fullName: true, email: true } } },
  });
  if (!student) throw NotFound("Student profile not found");

  const profile = serializeStudentProfile(student);

  const [applied, shortlisted, appliedDrives, eligibleDrives, applications] = await Promise.all([
    prisma.application.count({ where: { studentId } }),
    prisma.application.count({ where: { studentId, isShortlisted: true } }),
    prisma.application.findMany({ where: { studentId }, select: { driveId: true } }),
    // Top 6 open drives this student is eligible for, soonest deadline first.
    prisma.drive.findMany({
      where: { status: "open", driveEligibility: { some: { studentId, isEligible: true } } },
      orderBy: [{ applicationDeadline: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 6,
      include: {
        company: { select: { name: true, logoUrl: true } },
        driveSkills: { include: { skill: true } },
        applications: { where: { studentId }, select: { id: true } },
      },
    }),
    prisma.application.findMany({
      where: { studentId },
      orderBy: { appliedAt: "desc" },
      take: 8,
      include: { drive: { select: { id: true, title: true, company: { select: { name: true } } } } },
    }),
  ]);

  // Events visible to this student: global + their branch + personal + drives
  // they applied to; today or later.
  const visibility: Prisma.EventWhereInput[] = [
    { scope: "global" },
    { scope: "personal", ownerUserId: userId },
  ];
  if (student.branchId) {
    visibility.push({ scope: "branch", eventBranches: { some: { branchId: student.branchId } } });
  }
  const appliedDriveIds = appliedDrives.map((a) => a.driveId);
  if (appliedDriveIds.length > 0) {
    visibility.push({ scope: "drive", driveId: { in: appliedDriveIds } });
  }
  const todayUtc = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const events = await prisma.event.findMany({
    where: { eventDate: { gte: todayUtc }, OR: visibility },
    orderBy: [{ eventDate: "asc" }, { startTime: { sort: "asc", nulls: "first" } }],
    take: 5,
  });

  return {
    profile: {
      ...profile,
      fullName: student.user.fullName,
      email: student.user.email,
      completeness: completenessOf(profile),
    },
    counts: { applied, shortlisted },
    eligibleDrives: eligibleDrives.map((d) => ({
      id: d.id,
      title: d.title,
      company: { name: d.company.name, logoUrl: d.company.logoUrl },
      ctcLpa: d.ctcLpa === null ? null : d.ctcLpa.toNumber(),
      applicationDeadline: d.applicationDeadline,
      processType: d.processType,
      skills: d.driveSkills.map((ds) => ds.skill.name),
      hasApplied: d.applications.length > 0,
    })),
    applications: applications.map((a) => ({
      id: a.id,
      drive: { id: a.drive.id, title: a.drive.title, company: { name: a.drive.company.name } },
      status: a.status,
      isShortlisted: a.isShortlisted,
      appliedAt: a.appliedAt,
    })),
    upcomingEvents: events.map(serializeEvent),
  };
}

export const StudentsSelfService = {
  /** Serialised student profile for a user id, or null if they have no student row. */
  async profileFor(userId: string): Promise<StudentProfile | null> {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
    return student ? serializeStudentProfile(student) : null;
  },

  /** Resolve the caller's student row id; 404 if the profile row is missing. */
  async requireStudentId(user: AuthUser): Promise<string> {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!student) throw NotFound("Student profile not found");
    return student.id;
  },

  /**
   * PATCH /me/profile — editable contact fields + replace-set of skills.
   * Locked/academic fields are rejected upstream by the strict zod schema.
   */
  async updateProfile(user: AuthUser, input: UpdateProfileInput): Promise<StudentProfile> {
    const studentId = await this.requireStudentId(user);

    // A resume key must point at the caller's own upload prefix
    // (uploads module issues keys as resume/<userId>/<uuid>-<name>).
    if (input.resumeKey != null && !input.resumeKey.startsWith(`resume/${user.id}/`)) {
      throw BadRequest("resumeKey must reference your own uploaded resume");
    }

    const data: Prisma.StudentUpdateInput = {};
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.altEmail !== undefined) data.altEmail = input.altEmail;
    if (input.resumeKey !== undefined) data.resumeUrl = input.resumeKey;
    if (input.linkedinUrl !== undefined) data.linkedinUrl = input.linkedinUrl;
    if (input.githubUrl !== undefined) data.githubUrl = input.githubUrl;
    if (input.preferredLocation !== undefined) data.preferredLocation = input.preferredLocation;

    if (Object.keys(data).length > 0) {
      await prisma.student.update({ where: { id: studentId }, data });
    }
    if (input.skills !== undefined) {
      await replaceSkills(studentId, input.skills);
    }

    bump(`student:${studentId}`);

    const fresh = await prisma.student.findUnique({
      where: { id: studentId },
      include: PROFILE_INCLUDE,
    });
    if (!fresh) throw NotFound("Student profile not found");
    return serializeStudentProfile(fresh);
  },

  /** GET /me/dashboard — cached under student:<id> / "dash" for 30s. */
  async dashboard(user: AuthUser) {
    const studentId = await this.requireStudentId(user);
    return cached(`student:${studentId}`, "dash", 30, () => buildDashboard(user.id, studentId));
  },

  /** POST /corrections — snapshot the current value server-side. */
  async createCorrection(
    user: AuthUser,
    input: CreateCorrectionInput
  ): Promise<DataCorrectionRequest> {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { branch: true, program: true, user: { select: { fullName: true } } },
    });
    if (!student) throw NotFound("Student profile not found");

    return prisma.dataCorrectionRequest.create({
      data: {
        studentId: student.id,
        fieldName: input.fieldName,
        currentValue: correctionCurrentValue(student, input.fieldName),
        requestedValue: input.requestedValue,
        reason: input.reason ?? null,
      },
    });
  },

  /** GET /corrections/mine — the caller's own correction requests, newest first. */
  async myCorrections(user: AuthUser): Promise<DataCorrectionRequest[]> {
    const studentId = await this.requireStudentId(user);
    return prisma.dataCorrectionRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
  },
};

/**
 * Replace-set of the student's skills: unknown names are created in `skills`
 * (case-insensitive match so "react" reuses "React"), removed links deleted.
 */
async function replaceSkills(studentId: string, names: string[]): Promise<void> {
  // Dedupe case-insensitively, keeping the first spelling provided.
  const unique = [
    ...new Map(
      names
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
        .map((n) => [n.toLowerCase(), n] as const)
    ).values(),
  ];

  const skillIds: string[] = [];
  for (const name of unique) {
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    const skill = existing ?? (await prisma.skill.create({ data: { name }, select: { id: true } }));
    skillIds.push(skill.id);
  }

  await prisma.$transaction([
    prisma.studentSkill.deleteMany({ where: { studentId, skillId: { notIn: skillIds } } }),
    prisma.studentSkill.createMany({
      data: skillIds.map((skillId) => ({ studentId, skillId })),
      skipDuplicates: true,
    }),
  ]);
}
