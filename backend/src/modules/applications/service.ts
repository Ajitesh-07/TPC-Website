import { ApplicationStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { cached, bump } from "../../lib/cache";
import { notify } from "../../lib/notify";
import { HttpError, BadRequest, Forbidden, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/**
 * Applications — student applies to a drive; staff/recruiters move applications
 * through the pipeline. Row-level authz lives HERE (pattern: modules/drives):
 * recruiter → own company's drives only, coordinator → assigned drives only,
 * student → own application only. Never trust client-supplied ids for scoping.
 */

/** PATCH /applications/:id body (route parses; service receives typed input). */
export const patchApplicationBody = z
  .object({
    status: z.nativeEnum(ApplicationStatus).optional(),
    isShortlisted: z.boolean().optional(),
    currentStageId: z.string().uuid().nullable().optional(),
    note: z.string().min(1).max(2000).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: "Empty patch" });

export type PatchApplicationInput = z.infer<typeof patchApplicationBody>;

const Conflict = (m: string) => new HttpError(409, m, "conflict");

export const ApplicationsService = {
  /**
   * POST /drives/:id/apply — guards, in order: drive exists & open, deadline not
   * passed, student not blocked, eligibility-cache says eligible, no duplicate.
   */
  async apply(driveId: string, user: AuthUser) {
    const drive = await prisma.drive.findUnique({ where: { id: driveId } });
    if (!drive) throw NotFound("Drive not found");
    if (drive.status !== "open") throw BadRequest("Drive is not open for applications");

    if (drive.applicationDeadline !== null && drive.applicationDeadline.getTime() < Date.now()) {
      throw BadRequest("Application deadline has passed");
    }

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw Forbidden("No student profile for this account");
    if (student.isBlocked) throw Forbidden("Your account is blocked from applying");

    const eligibility = await prisma.driveEligibility.findUnique({
      where: { driveId_studentId: { driveId, studentId: student.id } },
    });
    if (!eligibility || !eligibility.isEligible) {
      throw Forbidden("You are not eligible for this drive");
    }

    const existing = await prisma.application.findUnique({
      where: { driveId_studentId: { driveId, studentId: student.id } },
    });
    if (existing) throw Conflict("You have already applied to this drive");

    let application;
    try {
      application = await prisma.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: { driveId, studentId: student.id }, // status defaults to "applied"
        });
        await tx.applicationStatusHistory.create({
          data: { applicationId: created.id, status: "applied", changedBy: user.id },
        });
        return created;
      });
    } catch (err) {
      // Unique (driveId, studentId) — two concurrent applies raced; same answer.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw Conflict("You have already applied to this drive");
      }
      throw err;
    }

    bump(`drive:${driveId}`, `student:${student.id}`, "drives");
    return application;
  },

  /** GET /applications/mine — the student's own applications, newest first. */
  async mine(user: AuthUser) {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw Forbidden("No student profile for this account");

    return cached(`student:${student.id}`, "applications", 30, () =>
      prisma.application.findMany({
        where: { studentId: student.id },
        orderBy: { appliedAt: "desc" },
        select: {
          id: true,
          status: true,
          isShortlisted: true,
          appliedAt: true,
          drive: {
            select: {
              id: true,
              title: true,
              status: true,
              company: { select: { name: true, logoUrl: true } },
            },
          },
          currentStage: { select: { type: true, status: true } },
        },
      })
    );
  },

  /**
   * PATCH /applications/:id — authz matrix:
   *   student owner            → only { status: "withdrawn" }
   *   recruiter (drive's co.)  → status / isShortlisted / currentStageId / note
   *   coordinator (assigned)   → same
   *   admin / super_admin      → same
   * currentStageId must belong to the application's drive. Status changes append
   * an application_status_history row with changedBy.
   */
  async patch(applicationId: string, body: PatchApplicationInput, user: AuthUser) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { drive: { select: { id: true, companyId: true } } },
    });
    if (!application) throw NotFound("Application not found");

    switch (user.role) {
      case "student": {
        const student = await prisma.student.findUnique({ where: { userId: user.id } });
        if (!student || student.id !== application.studentId) throw Forbidden();
        if (
          body.status !== "withdrawn" ||
          body.isShortlisted !== undefined ||
          body.currentStageId !== undefined ||
          body.note !== undefined
        ) {
          throw Forbidden("Students may only withdraw their own application");
        }
        break;
      }
      case "company": {
        const recruiter = await prisma.recruiter.findUnique({ where: { userId: user.id } });
        if (!recruiter || recruiter.companyId !== application.drive.companyId) throw Forbidden();
        break;
      }
      case "coordinator": {
        const coordinator = await prisma.coordinator.findUnique({ where: { userId: user.id } });
        const assigned =
          coordinator &&
          (await prisma.coordinatorAssignment.findFirst({
            where: { coordinatorId: coordinator.id, driveId: application.driveId },
          }));
        if (!assigned) throw Forbidden();
        break;
      }
      default:
        break; // admin | super_admin
    }

    // A stage may only be assigned from the application's own drive.
    if (body.currentStageId !== undefined && body.currentStageId !== null) {
      const stage = await prisma.driveStage.findUnique({ where: { id: body.currentStageId } });
      if (!stage || stage.driveId !== application.driveId) {
        throw BadRequest("Stage does not belong to this drive");
      }
    }

    const data: Prisma.ApplicationUncheckedUpdateInput = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.isShortlisted !== undefined) data.isShortlisted = body.isShortlisted;
    if (body.currentStageId !== undefined) data.currentStageId = body.currentStageId;

    const statusChanged = body.status !== undefined && body.status !== application.status;

    const updated =
      Object.keys(data).length === 0
        ? application
        : await prisma.$transaction(async (tx) => {
            const next = await tx.application.update({ where: { id: applicationId }, data });
            if (statusChanged) {
              await tx.applicationStatusHistory.create({
                data: {
                  applicationId,
                  status: body.status!,
                  note: body.note ?? null,
                  changedBy: user.id,
                },
              });
            }
            return next;
          });

    bump(`drive:${application.driveId}`, `student:${application.studentId}`);

    // Tell the student their application moved (not on their own withdrawal).
    if (statusChanged && user.role !== "student") {
      const meta = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { student: { select: { userId: true } }, drive: { select: { title: true } } },
      });
      if (meta) {
        notify(meta.student.userId, {
          category: "status",
          title: "Application update",
          message: `Your application for "${meta.drive.title}" is now ${body.status!.replace(/_/g, " ")}.`,
          link: "/student-dashboard",
        });
      }
    }

    return {
      id: updated.id,
      driveId: updated.driveId,
      studentId: updated.studentId,
      status: updated.status,
      isShortlisted: updated.isShortlisted,
      currentStageId: updated.currentStageId,
      appliedAt: updated.appliedAt,
      updatedAt: updated.updatedAt,
    };
  },
};
