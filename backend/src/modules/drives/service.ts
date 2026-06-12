import { prisma } from "../../lib/prisma";
import { Forbidden, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/**
 * Row-level access control lives HERE, not in the route guard. A recruiter only
 * sees their company's drives; a coordinator only their assigned drives; a
 * student only open drives they're eligible for (from the cache). Never trust an
 * id from the client — always scope by the authenticated user.
 */
export const DrivesService = {
  async list(user: AuthUser) {
    switch (user.role) {
      case "company": {
        const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
        if (!rec) return [];
        return prisma.drive.findMany({
          where: { companyId: rec.companyId },
          orderBy: { createdAt: "desc" },
        });
      }
      case "coordinator": {
        const coord = await prisma.coordinator.findUnique({ where: { userId: user.id } });
        if (!coord) return [];
        const owned = await prisma.coordinatorAssignment.findMany({
          where: { coordinatorId: coord.id },
          select: { driveId: true },
        });
        return prisma.drive.findMany({
          where: { id: { in: owned.map((o) => o.driveId) } },
          orderBy: { createdAt: "desc" },
        });
      }
      case "student": {
        const student = await prisma.student.findUnique({ where: { userId: user.id } });
        if (!student) return [];
        const eligible = await prisma.driveEligibility.findMany({
          where: { studentId: student.id, isEligible: true },
          select: { driveId: true },
        });
        return prisma.drive.findMany({
          where: { id: { in: eligible.map((e) => e.driveId) }, status: "open" },
        });
      }
      default: // admin | super_admin
        return prisma.drive.findMany({ orderBy: { createdAt: "desc" } });
    }
  },

  async get(driveId: string, user: AuthUser) {
    return this.assertCanView(driveId, user);
  },

  /** Roster of everyone who applied + their status + the student behind each. */
  async applicants(driveId: string, user: AuthUser) {
    await this.assertCanView(driveId, user);
    return prisma.application.findMany({
      where: { driveId },
      include: { student: { include: { user: true } } },
      orderBy: { appliedAt: "desc" },
    });
  },

  /** Throws 404/403 unless `user` may view this drive. */
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
      const coord = await prisma.coordinator.findUnique({ where: { userId: user.id } });
      const owns =
        coord &&
        (await prisma.coordinatorAssignment.findFirst({
          where: { coordinatorId: coord.id, driveId },
        }));
      if (!owns) throw Forbidden();
      return drive;
    }

    // student — only if eligible for this drive
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    const eligible =
      student &&
      (await prisma.driveEligibility.findFirst({
        where: { studentId: student.id, driveId, isEligible: true },
      }));
    if (!eligible) throw Forbidden();
    return drive;
  },
};
