import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { cached, bump } from "../../lib/cache";
import { audit } from "../../lib/audit";
import {
  BadRequest,
  Forbidden,
  HttpError,
  NotFound,
} from "../../middleware/errorHandler";
import { pageArgs, paged, type PageQuery } from "../../lib/pagination";
import type { AuthUser } from "../../middleware/auth";

/**
 * Super-admin user management + recruiter provisioning + approved-email policy
 * + the company lookup used by the Add-Drive form (see API_DESIGN.md
 * "User management"). Row-level scoping: a recruiter only ever sees their own
 * company; a super-admin can never modify their own account.
 */

export interface ListUsersQuery extends PageQuery {
  search?: string;
  role?: UserRole;
}

export interface PatchUserInput {
  role?: UserRole;
  status?: "active" | "revoked";
  /** Required when assigning the company role to a user with no recruiter profile. */
  companyId?: string;
}

export interface ProvisionRecruiterInput {
  email: string;
  fullName: string;
  designation?: string;
  companyId?: string;
  newCompany?: { name: string; website?: string; industry?: string; location?: string };
}

export interface ApprovedEmailInput {
  kind: "exact" | "domain";
  value: string;
  roleHint?: UserRole;
}

export interface CreateCompanyInput {
  name: string;
  website?: string;
  industry?: string;
  location?: string;
  /** Storage key from POST /uploads/presign — stored in logoUrl. */
  logoKey?: string;
}

const Conflict = (m: string) => new HttpError(409, m, "conflict");

const isUniqueViolation = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

const USER_ROW_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
} as const;

const COMPANY_SELECT = {
  id: true,
  name: true,
  industry: true,
  location: true,
  logoUrl: true,
  website: true,
} as const;

export const AdminUsersService = {
  // ── Users ────────────────────────────────────────────────────────────────

  async listUsers(q: ListUsersQuery) {
    const where: Prisma.UserWhereInput = {};
    if (q.search) {
      where.OR = [
        { fullName: { contains: q.search, mode: "insensitive" } },
        { email: { contains: q.search, mode: "insensitive" } },
      ];
    }
    if (q.role) where.role = q.role;

    const suffix = `${q.search ?? ""}|${q.role ?? ""}|${q.page}|${q.pageSize}`;
    return cached("users", suffix, 60, async () => {
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          ...pageArgs(q),
          orderBy: { createdAt: "desc" },
          select: USER_ROW_SELECT,
        }),
        prisma.user.count({ where }),
      ]);
      return paged(items, total, q);
    });
  },

  async patchUser(actor: AuthUser, id: string, body: PatchUserInput, ip?: string) {
    // A super-admin can never change their own role/status (lock-out / escalation guard).
    if (id === actor.id) throw Forbidden("You cannot modify your own account");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw NotFound("User not found");

    const changes: string[] = [];

    if (body.role !== undefined && body.role !== target.role) {
      if (body.role === "company") {
        // A company user must be backed by a recruiter profile.
        const recruiter = await prisma.recruiter.findUnique({ where: { userId: id } });
        if (!recruiter) {
          if (!body.companyId) {
            throw BadRequest("companyId is required when assigning the company role");
          }
          const company = await prisma.company.findUnique({ where: { id: body.companyId } });
          if (!company) throw BadRequest("companyId does not match an existing company");
          await prisma.recruiter.create({ data: { userId: id, companyId: company.id } });
        }
      }
      if (body.role === "student") {
        // We never fabricate academic records — the student row must already exist.
        const student = await prisma.student.findUnique({ where: { userId: id } });
        if (!student) throw Conflict("No student record exists for this user");
      }
      changes.push(`role: ${target.role}→${body.role}`);
    }

    if (body.status !== undefined && body.status !== target.status) {
      changes.push(`status: ${target.status}→${body.status}`);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
      select: USER_ROW_SELECT,
    });

    if (changes.length > 0) {
      audit(actor, "role_change", {
        targetTable: "users",
        targetId: id,
        targetLabel: target.email,
        details: changes.join("; "),
        ip,
      });
    }
    bump("users", "dash:admin");
    return updated;
  },

  // ── Recruiter provisioning ───────────────────────────────────────────────

  async provisionRecruiter(actor: AuthUser, body: ProvisionRecruiterInput, ip?: string) {
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw Conflict("A user with this email already exists");

    let created;
    try {
      created = await prisma.$transaction(async (tx) => {
        let companyId: string;
        if (body.companyId) {
          const company = await tx.company.findUnique({ where: { id: body.companyId } });
          if (!company) throw BadRequest("companyId does not match an existing company");
          companyId = company.id;
        } else {
          const company = await tx.company.create({
            data: {
              name: body.newCompany!.name,
              website: body.newCompany!.website,
              industry: body.newCompany!.industry,
              location: body.newCompany!.location,
            },
          });
          companyId = company.id;
        }

        const user = await tx.user.create({
          data: {
            email: body.email,
            fullName: body.fullName,
            role: "company",
            status: "active",
            authProvider: "email",
          },
        });
        const recruiter = await tx.recruiter.create({
          data: { userId: user.id, companyId, designation: body.designation },
        });
        return { user, recruiter };
      });
    } catch (err) {
      // Race with the pre-check above (citext unique on users.email).
      if (isUniqueViolation(err)) throw Conflict("A user with this email already exists");
      throw err;
    }

    audit(actor, "role_change", {
      targetTable: "users",
      targetId: created.user.id,
      targetLabel: created.user.email,
      details: "provisioned recruiter",
      ip,
    });
    bump("users", "dash:admin");

    return {
      id: created.user.id,
      email: created.user.email,
      fullName: created.user.fullName,
      role: created.user.role,
      status: created.user.status,
      recruiter: {
        id: created.recruiter.id,
        companyId: created.recruiter.companyId,
        designation: created.recruiter.designation,
      },
    };
  },

  // ── Approved emails (login allow-list) ───────────────────────────────────

  async listApprovedEmails() {
    return prisma.approvedEmail.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        kind: true,
        value: true,
        roleHint: true,
        createdAt: true,
        addedByUser: { select: { fullName: true } },
      },
    });
  },

  async addApprovedEmail(actor: AuthUser, body: ApprovedEmailInput, ip?: string) {
    let row;
    try {
      row = await prisma.approvedEmail.create({
        data: { kind: body.kind, value: body.value, roleHint: body.roleHint, addedBy: actor.id },
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw Conflict("This email/domain is already approved");
      throw err;
    }

    audit(actor, "policy", {
      targetTable: "approved_emails",
      targetId: row.id,
      targetLabel: row.value,
      details: `approved-email added (${row.kind})`,
      ip,
    });
    bump("users");
    return row;
  },

  async removeApprovedEmail(actor: AuthUser, id: string, ip?: string) {
    const row = await prisma.approvedEmail.findUnique({ where: { id } });
    if (!row) throw NotFound("Approved email not found");

    await prisma.approvedEmail.delete({ where: { id } });
    audit(actor, "policy", {
      targetTable: "approved_emails",
      targetId: id,
      targetLabel: row.value,
      details: `approved-email removed (${row.kind})`,
      ip,
    });
    bump("users");
    return { ok: true };
  },

  // ── Companies (Add-Drive select) ─────────────────────────────────────────

  async listCompanies(user: AuthUser) {
    if (user.role === "company") {
      // A recruiter only ever sees their own company.
      const recruiter = await prisma.recruiter.findUnique({ where: { userId: user.id } });
      if (!recruiter) return [];
      const company = await prisma.company.findUnique({
        where: { id: recruiter.companyId },
        select: COMPANY_SELECT,
      });
      return company ? [company] : [];
    }
    return prisma.company.findMany({ select: COMPANY_SELECT, orderBy: { name: "asc" } });
  },

  async createCompany(body: CreateCompanyInput) {
    return prisma.company.create({
      data: {
        name: body.name,
        website: body.website,
        industry: body.industry,
        location: body.location,
        logoUrl: body.logoKey,
      },
      select: COMPANY_SELECT,
    });
  },
};
