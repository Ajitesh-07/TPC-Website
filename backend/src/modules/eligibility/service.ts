import { prisma } from "../../lib/prisma";
import { bump } from "../../lib/cache";

/**
 * Eligibility engine — materialises drive_eligibility (see API_DESIGN.md).
 * Runs in the BullMQ worker; enqueued on drive approval / rule change / student
 * academic change / block-unblock. Reason strings are part of the API contract.
 */

interface DriveRules {
  id: string;
  minCpi: { toNumber(): number } | null;
  allowBacklog: boolean;
  processType: string;
  branchIds: Set<string>;
  programIds: Set<string>;
}

interface StudentFacts {
  id: string;
  cpi: { toNumber(): number } | null;
  activeBacklogs: number;
  isBlocked: boolean;
  placementStatus: string;
  branchId: string | null;
  programId: string | null;
}

function evaluate(drive: DriveRules, student: StudentFacts): { isEligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (student.isBlocked) reasons.push("blocked");
  if (drive.minCpi !== null && (student.cpi === null || student.cpi.toNumber() < drive.minCpi.toNumber())) {
    reasons.push("below-min-cpi");
  }
  if (!drive.allowBacklog && student.activeBacklogs > 0) reasons.push("active-backlog");
  if (drive.branchIds.size > 0 && (!student.branchId || !drive.branchIds.has(student.branchId))) {
    reasons.push("branch-not-eligible");
  }
  if (drive.programIds.size > 0 && (!student.programId || !drive.programIds.has(student.programId))) {
    reasons.push("program-not-eligible");
  }
  if (student.placementStatus === "placed" && drive.processType === "fte") {
    reasons.push("already-placed");
  }

  return { isEligible: reasons.length === 0, reasons };
}

async function loadDriveRules(driveId: string): Promise<DriveRules | null> {
  const drive = await prisma.drive.findUnique({
    where: { id: driveId },
    include: { driveEligibleBranches: true, driveEligiblePrograms: true },
  });
  if (!drive) return null;
  return {
    id: drive.id,
    minCpi: drive.minCpi,
    allowBacklog: drive.allowBacklog,
    processType: drive.processType,
    branchIds: new Set(drive.driveEligibleBranches.map((b) => b.branchId)),
    programIds: new Set(drive.driveEligiblePrograms.map((p) => p.programId)),
  };
}

const STUDENT_FACTS = {
  id: true,
  cpi: true,
  activeBacklogs: true,
  isBlocked: true,
  placementStatus: true,
  branchId: true,
  programId: true,
} as const;

async function upsertRows(rows: { driveId: string; studentId: string; isEligible: boolean; reasons: string[] }[]) {
  // Chunked transaction of upserts — fine at this scale (thousands of students).
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.$transaction(
      rows.slice(i, i + CHUNK).map((r) =>
        prisma.driveEligibility.upsert({
          where: { driveId_studentId: { driveId: r.driveId, studentId: r.studentId } },
          update: { isEligible: r.isEligible, reasons: r.reasons, computedAt: new Date() },
          create: r,
        })
      )
    );
  }
}

/** Recompute eligibility of every student for one drive. */
export async function computeForDrive(driveId: string): Promise<number> {
  const drive = await loadDriveRules(driveId);
  if (!drive) return 0;

  const students = await prisma.student.findMany({ select: STUDENT_FACTS });
  await upsertRows(
    students.map((s) => ({ driveId, studentId: s.id, ...evaluate(drive, s) }))
  );
  bump("drives", `drive:${driveId}`);
  return students.length;
}

/** Recompute one student's eligibility across all active drives. */
export async function computeForStudent(studentId: string): Promise<number> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: STUDENT_FACTS });
  if (!student) return 0;

  const drives = await prisma.drive.findMany({
    where: { status: { in: ["open", "pending_approval"] } },
    include: { driveEligibleBranches: true, driveEligiblePrograms: true },
  });

  await upsertRows(
    drives.map((d) => ({
      driveId: d.id,
      studentId,
      ...evaluate(
        {
          id: d.id,
          minCpi: d.minCpi,
          allowBacklog: d.allowBacklog,
          processType: d.processType,
          branchIds: new Set(d.driveEligibleBranches.map((b) => b.branchId)),
          programIds: new Set(d.driveEligiblePrograms.map((p) => p.programId)),
        },
        student
      ),
    }))
  );
  bump("drives", `student:${studentId}`);
  return drives.length;
}

/** Enqueue-friendly job payloads. */
export type EligibilityJob = { driveId: string } | { studentId: string };

export async function processEligibilityJob(data: EligibilityJob): Promise<number> {
  if ("driveId" in data) return computeForDrive(data.driveId);
  return computeForStudent(data.studentId);
}
