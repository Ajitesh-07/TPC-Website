import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { audit } from "../../lib/audit";
import { NotFound } from "../../middleware/errorHandler";
import type { AuthUser } from "../../middleware/auth";

/**
 * Company Contacts (see PHASE2_DESIGN.md §3) — admin / super_admin only. There is
 * no row-level scoping: staff may view and log contact against any company. The
 * coarse role gate lives in the route plugin; this service owns the query shapes.
 */

export interface ContactsListQuery {
  search?: string;
  industry?: string;
}

export interface ContactLogInput {
  contactName: string;
  designation?: string;
  channel: "email" | "call" | "visit" | "other";
  note?: string;
  /** A YYYY-MM-DD string parsed into a Date (the column is @db.Date). */
  contactedOn: Date;
}

/** Date-only (@db.Date) value → its calendar day as `YYYY-MM-DD`, null-safe. */
function dateOnly(v: Date | null): string | null {
  if (v === null) return null;
  return v.toISOString().slice(0, 10);
}

export const ContactsService = {
  /**
   * Directory of companies for the contacts page. For each company we surface its
   * last-contacted date, a primary point of contact, and how many log rows exist.
   *
   * Efficiency: one `findMany` (with `_count` for the log count) plus a single
   * `groupBy` over the whole contact log for the max(contactedOn) per company —
   * no per-company round-trips, no N+1.
   */
  async list(q: ContactsListQuery) {
    const where: Prisma.CompanyWhereInput = {};
    if (q.search) {
      where.name = { contains: q.search, mode: "insensitive" };
    }
    if (q.industry && q.industry !== "all") {
      where.industry = q.industry;
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        industry: true,
        _count: { select: { companyContactLogs: true } },
        companyPocs: {
          where: { isPrimary: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { name: true, designation: true },
        },
      },
    });

    const companyIds = companies.map((c) => c.id);

    // max(contactedOn) per company in a single grouped query.
    const lastContactedByCompany = new Map<string, Date>();
    if (companyIds.length > 0) {
      const grouped = await prisma.companyContactLog.groupBy({
        by: ["companyId"],
        where: { companyId: { in: companyIds } },
        _max: { contactedOn: true },
      });
      for (const g of grouped) {
        if (g._max.contactedOn) lastContactedByCompany.set(g.companyId, g._max.contactedOn);
      }
    }

    return companies.map((c) => {
      const poc = c.companyPocs[0];
      return {
        id: c.id,
        name: c.name,
        industry: c.industry,
        lastContacted: dateOnly(lastContactedByCompany.get(c.id) ?? null),
        poc: poc ? { name: poc.name, designation: poc.designation } : null,
        logCount: c._count.companyContactLogs,
      };
    });
  },

  /** A single company with its POCs and full contact history (newest first). */
  async detail(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        industry: true,
        companyPocs: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          select: { id: true, name: true, designation: true, phone: true, email: true },
        },
        companyContactLogs: {
          orderBy: { contactedOn: "desc" },
          select: {
            id: true,
            contactName: true,
            designation: true,
            channel: true,
            note: true,
            contactedOn: true,
          },
        },
      },
    });
    if (!company) throw NotFound("Company not found");

    return {
      company: { id: company.id, name: company.name, industry: company.industry },
      pocs: company.companyPocs.map((p) => ({
        id: p.id,
        name: p.name,
        designation: p.designation,
        phone: p.phone,
        email: p.email,
      })),
      history: company.companyContactLogs.map((h) => ({
        id: h.id,
        contactName: h.contactName,
        designation: h.designation,
        channel: h.channel,
        note: h.note,
        contactedOn: h.contactedOn,
      })),
    };
  },

  /** Log a contact attempt against a company; recordedBy = the acting staff user. */
  async log(companyId: string, input: ContactLogInput, actor: AuthUser, ip?: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });
    if (!company) throw NotFound("Company not found");

    const entry = await prisma.companyContactLog.create({
      data: {
        companyId: company.id,
        contactName: input.contactName,
        designation: input.designation ?? null,
        channel: input.channel,
        note: input.note ?? null,
        contactedOn: input.contactedOn,
        recordedBy: actor.id,
      },
      select: {
        id: true,
        contactName: true,
        designation: true,
        channel: true,
        note: true,
        contactedOn: true,
      },
    });

    audit(actor, "data_edit", {
      targetTable: "company_contact_log",
      targetId: company.id,
      targetLabel: company.name,
      details: "contact logged",
      ip,
    });

    return entry;
  },
};
