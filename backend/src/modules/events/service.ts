import type { Event, EventScope, EventType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { cached, bump } from "../../lib/cache";
import { BadRequest, Forbidden, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/** Wire shape for a calendar event (dates/times as plain strings). */
export interface EventDto {
  id: string;
  type: EventType;
  scope: EventScope;
  title: string;
  detail: string | null;
  /** `YYYY-MM-DD` */
  eventDate: string;
  /** `HH:MM` or null */
  startTime: string | null;
  /** `HH:MM` or null */
  endTime: string | null;
  location: string | null;
  driveId: string | null;
}

export interface CreateEventInput {
  type: EventType;
  scope: EventScope;
  title: string;
  detail?: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  driveId?: string | null;
  branchIds?: string[];
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, "scope">>;

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` of a Date (UTC). */
const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** `YYYY-MM-DD` string → Date at UTC midnight (Prisma @db.Date). */
const parseDate = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

/** `HH:MM` string → Date on the 1970-01-01 base (Prisma @db.Time). */
const parseTime = (s: string): Date => new Date(`1970-01-01T${s}:00.000Z`);

/** Stored @db.Time value back to `HH:MM` (null-safe). */
const fmtTime = (d: Date | null): string | null => (d ? d.toISOString().slice(11, 16) : null);

function serialize(e: Event): EventDto {
  return {
    id: e.id,
    type: e.type,
    scope: e.scope,
    title: e.title,
    detail: e.detail,
    eventDate: isoDate(e.eventDate),
    startTime: fmtTime(e.startTime),
    endTime: fmtTime(e.endTime),
    location: e.location,
    driveId: e.driveId,
  };
}

/** All branchIds must exist, otherwise reject the request (avoids FK 500s). */
async function assertBranchesExist(branchIds: string[]): Promise<void> {
  const count = await prisma.branch.count({ where: { id: { in: branchIds } } });
  if (count !== branchIds.length) throw BadRequest("One or more branchIds are unknown");
}

/** The drive must exist; a coordinator must additionally be assigned to it. */
async function assertCanTargetDrive(driveId: string, user: AuthUser): Promise<void> {
  const drive = await prisma.drive.findUnique({ where: { id: driveId }, select: { id: true } });
  if (!drive) throw BadRequest("Unknown driveId");
  if (user.role === "coordinator") {
    const coord = await prisma.coordinator.findUnique({ where: { userId: user.id } });
    const assigned =
      coord &&
      (await prisma.coordinatorAssignment.findFirst({
        where: { coordinatorId: coord.id, driveId },
        select: { id: true },
      }));
    if (!assigned) throw Forbidden("Not assigned to this drive");
  }
}

/**
 * PATCH/DELETE rule (API_DESIGN.md "Calendar"):
 *   personal  → owner only;
 *   org scope → creator OR any coordinator/admin;
 *   super_admin → always.
 * Foreign personal events are invisible to students/companies, so report 404
 * (not 403) to avoid leaking their existence.
 */
async function assertCanModify(eventId: string, user: AuthUser): Promise<Event> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw NotFound("Event not found");

  if (user.role === "super_admin") return event;

  if (event.scope === "personal") {
    if (event.ownerUserId === user.id) return event;
    if (user.role === "coordinator" || user.role === "admin") throw Forbidden();
    throw NotFound("Event not found");
  }

  // global | branch | drive
  if (event.createdBy === user.id) return event;
  if (user.role === "coordinator" || user.role === "admin") return event;
  throw Forbidden();
}

/**
 * Row-level visibility lives HERE (pattern: modules/drives/service.ts). The
 * scoping inputs (student row, recruiter row) come from the authenticated user,
 * never from client-supplied ids.
 */
export const EventsService = {
  /** Events visible to `user` in [from, to] (defaults: today-30d .. today+90d). */
  async list(user: AuthUser, fromArg?: string, toArg?: string): Promise<EventDto[]> {
    const from = fromArg ?? isoDate(new Date(Date.now() - 30 * DAY_MS));
    const to = toArg ?? isoDate(new Date(Date.now() + 90 * DAY_MS));
    if (from > to) throw BadRequest("`from` must be on or before `to`");

    return cached("events", `${user.role}:${user.id}:${from}:${to}`, 60, async () => {
      const eventDate = { gte: parseDate(from), lte: parseDate(to) };
      let where: Prisma.EventWhereInput;

      if (user.role === "coordinator" || user.role === "admin" || user.role === "super_admin") {
        // Staff see everything.
        where = { eventDate };
      } else if (user.role === "company") {
        const or: Prisma.EventWhereInput[] = [
          { scope: "global" },
          { scope: "personal", ownerUserId: user.id },
        ];
        const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
        if (rec) or.push({ scope: "drive", drive: { companyId: rec.companyId } });
        where = { eventDate, OR: or };
      } else {
        // student
        const or: Prisma.EventWhereInput[] = [
          { scope: "global" },
          { scope: "personal", ownerUserId: user.id },
        ];
        const student = await prisma.student.findUnique({
          where: { userId: user.id },
          select: { id: true, branchId: true },
        });
        if (student) {
          if (student.branchId) {
            or.push({ scope: "branch", eventBranches: { some: { branchId: student.branchId } } });
          }
          // Drive events for drives they applied to OR are eligible for.
          const [applied, eligible] = await Promise.all([
            prisma.application.findMany({
              where: { studentId: student.id },
              select: { driveId: true },
            }),
            prisma.driveEligibility.findMany({
              where: { studentId: student.id, isEligible: true },
              select: { driveId: true },
            }),
          ]);
          const driveIds = [
            ...new Set([...applied.map((a) => a.driveId), ...eligible.map((e) => e.driveId)]),
          ];
          if (driveIds.length > 0) or.push({ scope: "drive", driveId: { in: driveIds } });
        }
        where = { eventDate, OR: or };
      }

      const events = await prisma.event.findMany({
        where,
        orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
      });
      return events.map(serialize);
    });
  },

  async create(user: AuthUser, input: CreateEventInput): Promise<EventDto> {
    // Students and recruiters can only create personal events for themselves,
    // regardless of what the client sent. Staff may use any scope.
    const scope: EventScope =
      user.role === "student" || user.role === "company" ? "personal" : input.scope;

    let ownerUserId: string | null = null;
    let driveId: string | null = null;
    let branchIds: string[] = [];

    if (scope === "personal") {
      ownerUserId = user.id;
    } else if (scope === "branch") {
      branchIds = input.branchIds ?? [];
      if (branchIds.length === 0) {
        throw BadRequest("branchIds is required for branch-scoped events");
      }
      await assertBranchesExist(branchIds);
    } else if (scope === "drive") {
      if (!input.driveId) throw BadRequest("driveId is required for drive-scoped events");
      await assertCanTargetDrive(input.driveId, user);
      driveId = input.driveId;
    }

    if (input.startTime && input.endTime && input.endTime <= input.startTime) {
      throw BadRequest("endTime must be after startTime");
    }

    const event = await prisma.event.create({
      data: {
        type: input.type,
        scope,
        title: input.title,
        detail: input.detail ?? null,
        eventDate: parseDate(input.eventDate),
        startTime: input.startTime ? parseTime(input.startTime) : null,
        endTime: input.endTime ? parseTime(input.endTime) : null,
        location: input.location ?? null,
        driveId,
        ownerUserId,
        createdBy: user.id,
        ...(branchIds.length > 0
          ? { eventBranches: { create: branchIds.map((branchId) => ({ branchId })) } }
          : {}),
      },
    });

    bump("events");
    return serialize(event);
  },

  async update(user: AuthUser, eventId: string, input: UpdateEventInput): Promise<EventDto> {
    const event = await assertCanModify(eventId, user);

    const data: Prisma.EventUpdateInput = {};
    if (input.type !== undefined) data.type = input.type;
    if (input.title !== undefined) data.title = input.title;
    if (input.detail !== undefined) data.detail = input.detail;
    if (input.location !== undefined) data.location = input.location;
    if (input.eventDate !== undefined) data.eventDate = parseDate(input.eventDate);
    if (input.startTime !== undefined) {
      data.startTime = input.startTime ? parseTime(input.startTime) : null;
    }
    if (input.endTime !== undefined) {
      data.endTime = input.endTime ? parseTime(input.endTime) : null;
    }
    if (input.startTime && input.endTime && input.endTime <= input.startTime) {
      throw BadRequest("endTime must be after startTime");
    }

    // Scope is immutable; the scope-specific targets may be retargeted only on
    // events that already have that scope.
    if (input.driveId !== undefined) {
      if (event.scope !== "drive") {
        throw BadRequest("driveId only applies to drive-scoped events");
      }
      if (!input.driveId) throw BadRequest("driveId cannot be cleared on a drive-scoped event");
      await assertCanTargetDrive(input.driveId, user);
      data.drive = { connect: { id: input.driveId } };
    }
    if (input.branchIds !== undefined) {
      if (event.scope !== "branch") {
        throw BadRequest("branchIds only applies to branch-scoped events");
      }
      if (input.branchIds.length === 0) {
        throw BadRequest("branchIds cannot be empty for a branch-scoped event");
      }
      await assertBranchesExist(input.branchIds);
      data.eventBranches = {
        deleteMany: {},
        create: input.branchIds.map((branchId) => ({ branchId })),
      };
    }

    const updated = await prisma.event.update({ where: { id: eventId }, data });
    bump("events");
    return serialize(updated);
  },

  async remove(user: AuthUser, eventId: string): Promise<{ ok: true }> {
    await assertCanModify(eventId, user);
    await prisma.event.delete({ where: { id: eventId } }); // event_branches cascade
    bump("events");
    return { ok: true };
  },
};
