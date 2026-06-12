import { Prisma, PlacementStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { audit } from "../../lib/audit";
import type { AuthUser } from "../../middleware/auth";

/** Hard cap on rows loaded by any export (matches PHASE2_DESIGN). */
const EXPORT_CAP = 5000;

/** Prisma Decimal → number (null-safe) for JSON responses. */
const dec = (v: Prisma.Decimal | null): number | null => (v === null ? null : Number(v));

/**
 * Minimal CSV serialiser. Builds a header row from the column keys followed by
 * one row per record. Any value containing a comma, double-quote or newline is
 * wrapped in double-quotes with internal quotes doubled (RFC 4180).
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.map((c) => csvCell(c as string)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvCell(row[c])).join(","));
  return [header, ...lines].join("\n");
}

export interface StudentsExportQuery {
  branch?: string;
  placementStatus?: PlacementStatus;
  format: "json" | "csv";
}

export interface CompaniesExportQuery {
  format: "json" | "csv";
}

interface StudentExportRow extends Record<string, unknown> {
  id: string;
  rollNo: string;
  fullName: string;
  email: string;
  branchCode: string | null;
  cpi: number | null;
  placementStatus: PlacementStatus;
  isBlocked: boolean;
  creditBalance: number;
}

interface CompanyExportRow extends Record<string, unknown> {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  drives: number;
}

const STUDENT_COLUMNS: (keyof StudentExportRow)[] = [
  "id",
  "rollNo",
  "fullName",
  "email",
  "branchCode",
  "cpi",
  "placementStatus",
  "isBlocked",
  "creditBalance",
];

const COMPANY_COLUMNS: (keyof CompanyExportRow)[] = [
  "id",
  "name",
  "industry",
  "location",
  "website",
  "drives",
];

/**
 * Global export (super-admin only — the route gate enforces the role). Loads up
 * to EXPORT_CAP rows matching the filters and returns them as JSON rows or a CSV
 * string. Every export is audited.
 */
export const ExportsService = {
  async students(q: StudentsExportQuery, actor: AuthUser, ip?: string) {
    const where: Prisma.StudentWhereInput = {};
    if (q.branch) where.branch = { code: q.branch };
    if (q.placementStatus) where.placementStatus = q.placementStatus;

    const rows = await prisma.student.findMany({
      where,
      take: EXPORT_CAP,
      orderBy: { rollNo: "asc" },
      select: {
        id: true,
        rollNo: true,
        cpi: true,
        placementStatus: true,
        isBlocked: true,
        creditBalance: true,
        user: { select: { fullName: true, email: true } },
        branch: { select: { code: true } },
      },
    });

    const items: StudentExportRow[] = rows.map((s) => ({
      id: s.id,
      rollNo: s.rollNo,
      fullName: s.user.fullName,
      email: s.user.email,
      branchCode: s.branch?.code ?? null,
      cpi: dec(s.cpi),
      placementStatus: s.placementStatus,
      isBlocked: s.isBlocked,
      creditBalance: s.creditBalance,
    }));

    audit(actor, "export", {
      targetTable: "students",
      details: "students export",
      ip,
    });

    return { items, columns: STUDENT_COLUMNS };
  },

  async companies(q: CompaniesExportQuery, actor: AuthUser, ip?: string) {
    const rows = await prisma.company.findMany({
      take: EXPORT_CAP,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        industry: true,
        location: true,
        website: true,
        _count: { select: { drives: true } },
      },
    });

    const items: CompanyExportRow[] = rows.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      location: c.location,
      website: c.website,
      drives: c._count.drives,
    }));

    audit(actor, "export", {
      targetTable: "companies",
      details: "companies export",
      ip,
    });

    return { items, columns: COMPANY_COLUMNS };
  },
};
