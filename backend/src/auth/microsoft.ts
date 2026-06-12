import { ConfidentialClientApplication } from "@azure/msal-node";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
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

  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) {
    if (existing.status === "revoked") throw Forbidden("Your access has been revoked");
    return prisma.user.update({
      where: { id: existing.id },
      data: { lastLoginAt: new Date() },
    });
  }

  const domain = lower.split("@")[1] ?? "";
  const approved = await prisma.approvedEmail.findFirst({
    where: { value: { in: [lower, domain] } },
  });
  if (!approved) throw Forbidden("This email is not approved for access");

  return prisma.user.create({
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
