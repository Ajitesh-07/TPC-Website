import { ConfidentialClientApplication } from "@azure/msal-node";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { queues } from "../lib/queue";
import { Forbidden } from "../middleware/errorHandler";

export const SCOPES = ["openid", "profile", "email", "User.Read"];

export const msal = new ConfidentialClientApplication({
  auth: {
    clientId: env.azure.clientId ?? "",
    authority: `https://login.microsoftonline.com/${env.azure.tenantId ?? "common"}`,
    clientSecret: env.azure.clientSecret ?? "",
  },
});

/**
 * Map a signed-in Microsoft account to a TPC user:
 *   - existing user  -> bump last login (blocked if their access was revoked)
 *   - new account    -> allowed only if its email or domain is on approved_emails;
 *                       created with that entry's role hint (defaults to student)
 */
export async function resolveUser(email: string, fullName: string) {
  const lower = email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { email: lower } });
  if (user) {
    if (user.status === "revoked") throw Forbidden("Your access has been revoked");
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } else {
    const domain = lower.split("@")[1] ?? "";
    const approved = await prisma.approvedEmail.findFirst({
      where: { value: { in: [lower, domain] } },
    });
    if (!approved) throw Forbidden("This email is not approved for access");

    user = await prisma.user.create({
      data: {
        email: lower,
        fullName,
        role: approved.roleHint ?? "student",
        status: "active",
        authProvider: "microsoft",
        lastLoginAt: new Date(),
      },
    });
  }

  // A student authenticates with their institute email, but their academic
  // record (roll no, branch, CPI) normally arrives via the admin master-data
  // import. Without a `students` row every student page 404s, so we guarantee a
  // minimal placeholder exists (the import / a data-correction fills it later).
  if (user.role === "student") {
    await ensureStudentProfile(user.id, user.email);
  }

  return user;
}

async function ensureStudentProfile(userId: string, email: string): Promise<void> {
  const existing = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return;

  const local = (email.split("@")[0] || userId.slice(0, 8)).toUpperCase();
  let rollNo = local;
  if (await prisma.student.findUnique({ where: { rollNo }, select: { id: true } })) {
    rollNo = `${local}-${userId.slice(0, 4)}`;
  }

  let student;
  try {
    student = await prisma.student.create({
      data: { userId, rollNo, emailVerified: true },
    });
  } catch {
    // A concurrent login already created it — fine.
    return;
  }

  // Compute eligibility so the catalogue isn't empty (needs the worker running).
  queues.eligibility.add("recompute", { studentId: student.id }).catch(() => {});
}
