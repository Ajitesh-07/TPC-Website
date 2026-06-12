import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { cached } from "../../lib/cache";
import { Forbidden } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/**
 * Read-only dashboard aggregates (see API_DESIGN.md "Dashboards").
 * Everything here is cached for 30s under `dash:<role>` (plus `:<userId>` for
 * company/coordinator, whose payloads are user-scoped). Row-level scoping lives
 * in this service: a recruiter only sees their own company, a coordinator only
 * their assigned drives — never trust a client-supplied id.
 */

const DASH_TTL = 30;

const EVENT_SELECT = {
  id: true,
  type: true,
  scope: true,
  title: true,
  detail: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  location: true,
  driveId: true,
  drive: { select: { id: true, title: true } },
} satisfies Prisma.EventSelect;

const EVENT_ORDER: Prisma.EventOrderByWithRelationInput[] = [
  { eventDate: "asc" },
  { startTime: "asc" },
];

/** Start of the current day (UTC) — `events.event_date` is a date column. */
function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Upcoming events that are global OR attached to one of the given drives. */
function upcomingEventsWhere(driveIds: string[]): Prisma.EventWhereInput {
  return {
    eventDate: { gte: startOfTodayUTC() },
    OR: [{ scope: "global" }, { scope: "drive", driveId: { in: driveIds } }],
  };
}

export const DashboardsService = {
  /** Recruiter home: own company, its drives + applicant counts, itinerary, POCs. */
  async company(user: AuthUser) {
    return cached(`dash:company:${user.id}`, "main", DASH_TTL, async () => {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId: user.id },
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true, industry: true, location: true },
          },
        },
      });
      if (!recruiter) throw Forbidden("No recruiter profile is linked to this account");

      const drives = await prisma.drive.findMany({
        where: { companyId: recruiter.companyId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { applications: true } },
        },
      });
      const driveIds = drives.map((d) => d.id);

      const [shortlists, itinerary, pocs] = await Promise.all([
        prisma.application.groupBy({
          by: ["driveId"],
          where: { driveId: { in: driveIds }, isShortlisted: true },
          _count: { _all: true },
        }),
        prisma.event.findMany({
          where: upcomingEventsWhere(driveIds),
          orderBy: EVENT_ORDER,
          take: 6,
          select: EVENT_SELECT,
        }),
        prisma.companyPoc.findMany({
          where: { companyId: recruiter.companyId },
          orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            designation: true,
            phone: true,
            email: true,
            isPrimary: true,
          },
        }),
      ]);

      const shortlistedByDrive = new Map(shortlists.map((s) => [s.driveId, s._count._all]));

      return {
        company: recruiter.company,
        drives: drives.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          applicants: d._count.applications,
          shortlisted: shortlistedByDrive.get(d.id) ?? 0,
        })),
        itinerary,
        pocs,
      };
    });
  },

  /** Coordinator home: metrics + drive list + schedule, all over ASSIGNED drives only. */
  async coordinator(user: AuthUser) {
    return cached(`dash:coordinator:${user.id}`, "main", DASH_TTL, async () => {
      const coordinator = await prisma.coordinator.findUnique({ where: { userId: user.id } });
      if (!coordinator) {
        // No coordinator profile yet — an empty (but well-shaped) dashboard.
        return {
          metrics: { activeDrives: 0, pendingApplications: 0, offersMade: 0, upcomingInterviews: 0 },
          drives: [],
          schedule: [],
        };
      }

      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { coordinatorId: coordinator.id },
        select: { driveId: true },
      });
      const driveIds = assignments.map((a) => a.driveId);

      const [activeDrives, pendingApplications, offersMade, upcomingInterviews, drives, schedule] =
        await Promise.all([
          prisma.drive.count({ where: { id: { in: driveIds }, status: "open" } }),
          prisma.application.count({
            where: { driveId: { in: driveIds }, status: { in: ["applied", "under_review"] } },
          }),
          prisma.application.count({
            where: { driveId: { in: driveIds }, status: { in: ["offered", "accepted"] } },
          }),
          prisma.driveStage.count({
            where: {
              driveId: { in: driveIds },
              type: "interview",
              status: { in: ["upcoming", "ongoing"] },
            },
          }),
          prisma.drive.findMany({
            where: { id: { in: driveIds } },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              company: { select: { name: true } },
              _count: { select: { applications: true } },
            },
          }),
          prisma.event.findMany({
            where: upcomingEventsWhere(driveIds),
            orderBy: EVENT_ORDER,
            take: 6,
            select: EVENT_SELECT,
          }),
        ]);

      return {
        metrics: { activeDrives, pendingApplications, offersMade, upcomingInterviews },
        drives: drives.map((d) => ({
          id: d.id,
          company: d.company.name,
          title: d.title,
          status: d.status,
          applicants: d._count.applications,
        })),
        schedule,
      };
    });
  },

  /** Admin / super-admin home: institute-wide stats + approval queue + activity. */
  async admin() {
    return cached("dash:admin", "main", DASH_TTL, async () => {
      const [
        totalPlacements,
        activeCompanies,
        registeredStudents,
        pendingDriveCount,
        pendingCorrectionCount,
        pendingDrives,
        upcomingEvents,
        recentRoleChanges,
      ] = await Promise.all([
        prisma.application.count({ where: { status: "accepted" } }),
        prisma.company.count({ where: { drives: { some: { status: "open" } } } }),
        prisma.student.count(),
        prisma.drive.count({ where: { status: "pending_approval" } }),
        prisma.dataCorrectionRequest.count({ where: { status: "pending" } }),
        prisma.drive.findMany({
          where: { status: "pending_approval" },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            updatedAt: true,
            company: { select: { name: true } },
          },
        }),
        prisma.event.findMany({
          where: { scope: "global", eventDate: { gte: startOfTodayUTC() } },
          orderBy: EVENT_ORDER,
          take: 6,
          select: EVENT_SELECT,
        }),
        prisma.auditLog.findMany({
          where: { action: "role_change" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            actorRole: true,
            targetLabel: true,
            details: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        stats: {
          totalPlacements,
          activeCompanies,
          registeredStudents,
          pendingApprovals: pendingDriveCount + pendingCorrectionCount,
        },
        pendingDrives: pendingDrives.map((d) => ({
          id: d.id,
          company: d.company.name,
          title: d.title,
          submittedAt: d.updatedAt,
        })),
        upcomingEvents,
        recentRoleChanges,
      };
    });
  },
};
