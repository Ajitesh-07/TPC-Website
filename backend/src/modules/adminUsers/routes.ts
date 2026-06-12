import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../../middleware/auth";
import { pageQuery } from "../../lib/pagination";
import { AdminUsersService } from "./service";

const ROLES = ["student", "company", "coordinator", "admin", "super_admin"] as const;

const idParam = z.object({ id: z.string().uuid() });

const usersQuery = pageQuery.extend({
  search: z.string().trim().min(1).max(200).optional(),
  role: z.enum(ROLES).optional(),
});

const patchUserBody = z
  .object({
    role: z.enum(ROLES).optional(),
    status: z.enum(["active", "revoked"]).optional(),
    companyId: z.string().uuid().optional(),
  })
  .refine((b) => b.role !== undefined || b.status !== undefined, {
    message: "Provide role and/or status to update",
  });

const newCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
});

const provisionRecruiterBody = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    fullName: z.string().trim().min(1).max(200),
    designation: z.string().trim().max(200).optional(),
    companyId: z.string().uuid().optional(),
    newCompany: newCompanySchema.optional(),
  })
  .refine((b) => (b.companyId !== undefined) !== (b.newCompany !== undefined), {
    message: "Provide exactly one of companyId or newCompany",
  });

const approvedEmailBody = z
  .object({
    kind: z.enum(["exact", "domain"]),
    value: z
      .string()
      .trim()
      .min(1)
      .max(254)
      .transform((v) => v.toLowerCase()),
    roleHint: z.enum(ROLES).optional(),
  })
  .refine((b) => !(b.kind === "domain" && b.value.includes("@")), {
    message: "A domain entry must not contain '@'",
  });

const companyBody = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().max(300).optional(),
  industry: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  logoKey: z.string().trim().max(500).optional(),
});

/** Super-admin user management, recruiter provisioning, approved emails, companies. */
export async function adminUserRoutes(app: FastifyInstance) {
  const superAdminOnly = requireRole("super_admin");
  const adminOrSuper = requireRole("admin", "super_admin");

  // Searchable, paginated user list for the access-control screen.
  app.get("/admin/users", { preHandler: superAdminOnly }, async (req) =>
    AdminUsersService.listUsers(usersQuery.parse(req.query))
  );

  // Change a user's role and/or status (self-modification rejected in the service).
  app.patch("/admin/users/:id", { preHandler: superAdminOnly }, async (req) => {
    const { id } = idParam.parse(req.params);
    return AdminUsersService.patchUser(req.authUser!, id, patchUserBody.parse(req.body), req.ip);
  });

  // Provision a recruiter account (user + recruiter profile, optional new company).
  app.post("/admin/recruiters", { preHandler: adminOrSuper }, async (req) =>
    AdminUsersService.provisionRecruiter(
      req.authUser!,
      provisionRecruiterBody.parse(req.body),
      req.ip
    )
  );

  // Login allow-list (exact emails / whole domains).
  app.get("/admin/approved-emails", { preHandler: superAdminOnly }, async () =>
    AdminUsersService.listApprovedEmails()
  );

  app.post("/admin/approved-emails", { preHandler: superAdminOnly }, async (req) =>
    AdminUsersService.addApprovedEmail(req.authUser!, approvedEmailBody.parse(req.body), req.ip)
  );

  app.delete("/admin/approved-emails/:id", { preHandler: superAdminOnly }, async (req) => {
    const { id } = idParam.parse(req.params);
    return AdminUsersService.removeApprovedEmail(req.authUser!, id, req.ip);
  });

  // Company lookup for the Add-Drive select (recruiter sees only their own).
  app.get(
    "/companies",
    { preHandler: requireRole("company", "coordinator", "admin", "super_admin") },
    async (req) => AdminUsersService.listCompanies(req.authUser!)
  );

  app.post(
    "/companies",
    { preHandler: requireRole("coordinator", "admin", "super_admin") },
    async (req) => AdminUsersService.createCompany(companyBody.parse(req.body))
  );
}
