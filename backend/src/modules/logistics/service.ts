import type { LogisticsRequest, VisitingTeamMember } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { Forbidden, NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";
import type { LogisticsUpsertInput, TeamMemberInput } from "./schemas";

/**
 * Logistics is a per-company singleton: each company has at most one (the latest)
 * logistics request, plus a visiting team and a read-only confirmed schedule
 * derived from the company's drive events. Row-level scoping lives HERE — the
 * recruiter is always forced onto their OWN company; we never trust a client id.
 */

/** Resolve the recruiter's company from the authed user (403 if not a recruiter). */
async function resolveCompanyId(user: AuthUser): Promise<string> {
  const rec = await prisma.recruiter.findUnique({ where: { userId: user.id } });
  if (!rec) throw Forbidden("No recruiter profile for this account");
  return rec.companyId;
}

/** The company's latest logistics request, or null. */
function findRequest(companyId: string) {
  return prisma.logisticsRequest.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

/** Shape a LogisticsRequest row for responses (Dates stay as Dates → JSON ISO). */
function toRequest(r: LogisticsRequest) {
  return {
    id: r.id,
    accommodationRequired: r.accommodationRequired,
    roomsRequired: r.roomsRequired,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    dietaryPreference: r.dietaryPreference,
    specialRequests: r.specialRequests,
    venuePreference: r.venuePreference,
    systemsRequired: r.systemsRequired,
    projectorRequired: r.projectorRequired,
    internetRequired: r.internetRequired,
    technicalNotes: r.technicalNotes,
  };
}

/** Default (unsaved) request object with a null id when none exists yet. */
function defaultRequest() {
  return {
    id: null,
    accommodationRequired: false,
    roomsRequired: null,
    checkIn: null,
    checkOut: null,
    dietaryPreference: null,
    specialRequests: null,
    venuePreference: null,
    systemsRequired: null,
    projectorRequired: false,
    internetRequired: false,
    technicalNotes: null,
  };
}

function toMember(m: VisitingTeamMember) {
  return {
    id: m.id,
    name: m.name,
    designation: m.designation,
    phone: m.phone,
    email: m.email,
  };
}

/** @db.Time → "HH:MM" (UTC) string, null-safe. */
function toHHMM(t: Date | null): string | null {
  if (t === null) return null;
  const hh = String(t.getUTCHours()).padStart(2, "0");
  const mm = String(t.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export const LogisticsService = {
  /** Company's logistics request (or a null-id default) + team + confirmed schedule. */
  async get(user: AuthUser) {
    const companyId = await resolveCompanyId(user);
    const request = await findRequest(companyId);

    const team = request
      ? await prisma.visitingTeamMember.findMany({
          where: { logisticsRequestId: request.id },
          orderBy: { name: "asc" },
        })
      : [];

    // Confirmed schedule = events of the company's own drives.
    const events = await prisma.event.findMany({
      where: { scope: "drive", drive: { companyId } },
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
      },
    });

    return {
      request: request ? toRequest(request) : defaultRequest(),
      team: team.map(toMember),
      schedule: events.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        eventDate: e.eventDate,
        startTime: toHHMM(e.startTime),
        endTime: toHHMM(e.endTime),
        location: e.location,
      })),
    };
  },

  /** Upsert the company's singleton logistics request and return the saved row. */
  async upsert(user: AuthUser, input: LogisticsUpsertInput) {
    const companyId = await resolveCompanyId(user);
    const existing = await findRequest(companyId);

    const data = {
      accommodationRequired: input.accommodationRequired,
      roomsRequired: input.roomsRequired ?? null,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      dietaryPreference: input.dietaryPreference ?? null,
      specialRequests: input.specialRequests ?? null,
      venuePreference: input.venuePreference ?? null,
      systemsRequired: input.systemsRequired ?? null,
      projectorRequired: input.projectorRequired,
      internetRequired: input.internetRequired,
      technicalNotes: input.technicalNotes ?? null,
    };

    if (existing) {
      const updated = await prisma.logisticsRequest.update({
        where: { id: existing.id },
        data,
      });
      return toRequest(updated);
    }

    const season = await prisma.placementSeason.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const created = await prisma.logisticsRequest.create({
      data: { ...data, companyId, seasonId: season?.id ?? null },
    });
    return toRequest(created);
  },

  /** Add a visiting team member, creating an empty logistics request if needed. */
  async addTeamMember(user: AuthUser, input: TeamMemberInput) {
    const companyId = await resolveCompanyId(user);

    let request = await findRequest(companyId);
    if (!request) {
      const season = await prisma.placementSeason.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      request = await prisma.logisticsRequest.create({
        data: { companyId, seasonId: season?.id ?? null },
      });
    }

    const member = await prisma.visitingTeamMember.create({
      data: {
        logisticsRequestId: request.id,
        name: input.name,
        designation: input.designation ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
      },
    });
    return toMember(member);
  },

  /** Delete a visiting team member only if it belongs to the recruiter's company. */
  async removeTeamMember(user: AuthUser, memberId: string) {
    const companyId = await resolveCompanyId(user);

    const member = await prisma.visitingTeamMember.findUnique({
      where: { id: memberId },
      select: { id: true, logisticsRequest: { select: { companyId: true } } },
    });
    if (!member) throw NotFound("Team member not found");
    if (member.logisticsRequest.companyId !== companyId) throw Forbidden();

    await prisma.visitingTeamMember.delete({ where: { id: memberId } });
    return { id: memberId, deleted: true };
  },
};
